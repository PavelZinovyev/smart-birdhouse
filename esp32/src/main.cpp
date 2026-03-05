/**
 * Smart Birdhouse — ESP32-S3 N16R8
 *
 * - WiFi AP: точка доступа для телефона
 * - HTTP-сервер: раздаёт фронтенд (SPIFFS) + JSON API
 * - API: GET /api/sensors, POST /api/pi/power
 * - Датчики: SHT31 (temp/humidity), VL53L0X (distance), BQ25895 (батарея, I2C 0x6A)
 * - Управление Pi: MOSFET (питание), PI_MODE_PIN (manual/auto)
 */

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>
#include <SPIFFS.h>
#include <ArduinoJson.h>
#include "Adafruit_SHT31.h"
#include "Adafruit_VL53L0X.h"

// ---------- PINS (ESP32-S3) ----------
#define PI_SIGNAL_PIN   6
#define PI_READY_PIN    4
#define PI_POWER_PIN    5
#define PI_MODE_PIN     8
#define LED_PIN         7
#define I2C_SDA         21
#define I2C_SCL         20

// I2C для BQ25895 (отдельная шина)
#define BQ_I2C_SDA      17
#define BQ_I2C_SCL      16

// ---------- WiFi AP (SSID/пароль из esp32/include/secrets.h, генерируется из .env) ----------
#include "secrets.h"
const char* ap_ssid     = AP_SSID;
const char* ap_password = AP_PASSWORD;
IPAddress ap_ip(192, 168, 4, 1);
IPAddress ap_gw(192, 168, 4, 1);
IPAddress ap_subnet(255, 255, 255, 0);

// ---------- Sensors ----------
Adafruit_SHT31 sht31 = Adafruit_SHT31();
Adafruit_VL53L0X lox = Adafruit_VL53L0X();

// ---------- BQ25895 (I2C адрес 0x6A при ADDR→GND). Регистры по даташиту TI ----------
// BQ25895 НЕ имеет встроенного fuel gauge: регистры только до 0x14.
// % заряда считается из напряжения (см. voltageToPercent).
#define BQ25895_ADDR  0x6A
#define REG_ADC_CTRL  0x02  // bit7=CONV_START, bit6=CONV_RATE (0=one-shot, 1=continuous 1s)
#define REG_STATUS    0x0B  // bit4:3=CHRG_STAT, bit7:5=VBUS_STAT
#define REG_VBAT      0x0E  // BATV bits [6:0]: V = x*0.02 + 2.304
#define REG_ICHGR     0x12  // ICHGR bits [6:0]: I = 50*x mA (ток заряда, 0 если зарядник не подключён)

// ---------- Settings ----------
const int BIRD_TRIGGER_DISTANCE = 50;
const int STABLE_COUNT_REQUIRED = 2;
const unsigned long PI_SHUTDOWN_DELAY_MS = 20000;  // задержка перед отключением питания Pi после запроса shutdown (мс)

// ---------- State ----------
enum SystemState {
  IDLE,
  POWERING_PI,
  RECORDING,
  SHUTTING_DOWN_PI,
  COOLDOWN
};
SystemState state = IDLE;
unsigned long stateStartTime = 0;
int stableCounter = 0;

// Ручное включение Pi (с фронта) — не запускаем авто-запись по птице
bool piPoweredByUser = false;

WebServer server(80);
static bool spiffsMounted = false;

// Вторая I2C-шина для BQ25895 (Wire = I2C0 на 21/20, BQWire = I2C1 на 17/16)
TwoWire BQWire = TwoWire(1);

// ---------- I2C helper (BQ25895) ----------
uint8_t read8(uint8_t reg) {
  BQWire.beginTransmission(BQ25895_ADDR);
  BQWire.write(reg);
  if (BQWire.endTransmission(false) != 0) return 0;
  if (BQWire.requestFrom((uint8_t)BQ25895_ADDR, (uint8_t)1) != 1) return 0;
  return BQWire.read();
}

void write8(uint8_t reg, uint8_t val) {
  BQWire.beginTransmission(BQ25895_ADDR);
  BQWire.write(reg);
  BQWire.write(val);
  BQWire.endTransmission();
}

// BATV в 0x0E bits [6:0]: V = x*0.02 + 2.304 (даташит TI)
float getBatteryVoltage() {
  uint8_t raw = read8(REG_VBAT) & 0x7F;
  return (raw * 0.02f) + 2.304f;
}

// ICHGR в 0x12 bits [6:0]: I = 50*x mA (ток заряда, 0 если зарядник не подключён к VBUS)
float getBatteryCurrent() {
  uint8_t raw = read8(REG_ICHGR) & 0x7F;
  return raw * 50.0f;
}

// BQ25895 не имеет SOC-регистра — считаем % по кривой напряжения Li-ion (3.0В=0%, 4.2В=100%)
uint8_t voltageToPercent(float v) {
  if (v >= 4.20f) return 100;
  if (v >= 4.05f) return (uint8_t)(80 + (v - 4.05f) / 0.15f * 20);
  if (v >= 3.85f) return (uint8_t)(50 + (v - 3.85f) / 0.20f * 30);
  if (v >= 3.65f) return (uint8_t)(20 + (v - 3.65f) / 0.20f * 30);
  if (v >= 3.00f) return (uint8_t)(     (v - 3.00f) / 0.65f * 20);
  return 0;
}

// ---------- Pi power ----------
void piPowerOn(bool manualMode) {
  Serial.println(F("⚡ PI POWER ON"));
  piPoweredByUser = manualMode;
  digitalWrite(PI_MODE_PIN, manualMode ? HIGH : LOW);
  digitalWrite(LED_PIN, HIGH);
  digitalWrite(PI_POWER_PIN, LOW);  // P-MOSFET: LOW = питание включено
}

void piPowerOff() {
  Serial.println(F("🔌 PI POWER OFF"));
  piPoweredByUser = false;
  digitalWrite(LED_PIN, LOW);
  digitalWrite(PI_POWER_PIN, HIGH);
}

// ---------- Sensor cache (обновляется раз в 2 с, без блокировки loop) ----------
struct SensorCache {
  float temp     = 0;
  float humidity = 0;
  int   distance = -1;
  unsigned long lastUpdate = 0;
} sensors;

static bool sht31Ok = false;
static bool lox0Ok  = false;

// ---------- Distance ----------
int readDistanceMM() {
  VL53L0X_RangingMeasurementData_t measure;
  lox.rangingTest(&measure, false);
  if (measure.RangeStatus != 4) return measure.RangeMilliMeter;
  return -1;
}

int getFilteredDistance() {
  const int samples = 5;
  int sum = 0, valid = 0;
  for (int i = 0; i < samples; i++) {
    int d = readDistanceMM();
    if (d > 0) { sum += d; valid++; }
    delay(30);
  }
  return valid == 0 ? -1 : (sum / valid);
}

void updateSensors() {
  unsigned long now = millis();
  if (now - sensors.lastUpdate < 2000) return;
  sensors.lastUpdate = now;
  if (sht31Ok) {
    float t = sht31.readTemperature();
    float h = sht31.readHumidity();
    sensors.temp     = isnan(t) ? 0.0f : t;
    sensors.humidity = isnan(h) ? 0.0f : h;
  }
  if (lox0Ok) {
    sensors.distance = readDistanceMM();
  }
}

bool birdDetected(int distance) {
  if (distance < 0) return false;
  if (distance < BIRD_TRIGGER_DISTANCE) {
    stableCounter++;
    if (stableCounter >= STABLE_COUNT_REQUIRED) {
      stableCounter = 0;
      return true;
    }
  } else {
    stableCounter = 0;
  }
  return false;
}

// ---------- API: GET /api/sensors ----------
void handleGetSensors() {
  float temp     = sensors.temp;
  float hum      = sensors.humidity;
  int   distance = sensors.distance;
  float vBat     = getBatteryVoltage();
  float iBat     = getBatteryCurrent();

  bool    batteryOk  = (vBat > 3.0f);
  float   batteryVal = batteryOk ? (round(vBat * 100) / 100.0f) : 0.0f;
  uint8_t soc        = batteryOk ? voltageToPercent(vBat) : 0;

  // Лог в Serial при каждом запросе /api/sensors
  uint8_t rawVbat  = read8(REG_VBAT) & 0x7F;
  uint8_t rawIchgr = read8(REG_ICHGR) & 0x7F;
  uint8_t status   = read8(REG_STATUS);
  uint8_t vbusStat = (status >> 5) & 0x07;  
  uint8_t chrgStat = (status >> 3) & 0x03; 

  bool externalPowerPresent = (vbusStat == 0x1 || vbusStat == 0x2); 
  bool batteryCharging      = (chrgStat == 0x1 || chrgStat == 0x2);  
  bool batteryChargeDone    = (chrgStat == 0x3);                     
  Serial.printf("[sensors] t=%.1f h=%.1f d=%d | vBat=%.2fV raw=0x%02X ichg=%.0fmA raw=0x%02X soc=%u%% | REG0B=0x%02X\n",
    temp, hum, distance, vBat, rawVbat, iBat, rawIchgr, soc, status);

  JsonDocument doc;
  doc["temperature"]       = round(temp * 10) / 10.0;
  doc["humidity"]          = round(hum * 10) / 10.0;
  doc["distance_mm"]       = distance;
  doc["battery"]           = batteryVal;
  doc["battery_available"] = batteryOk;
  doc["battery_voltage"]   = batteryVal;
  doc["battery_current"]   = round(iBat);
  doc["battery_percent"]   = soc;
  doc["battery_charging"]      = batteryOk && batteryCharging;
  doc["battery_charge_done"]   = batteryOk && batteryChargeDone;
  doc["battery_power_present"] = externalPowerPresent;
  doc["battery_charge_state"]  = (int)chrgStat;

  server.sendHeader(F("Access-Control-Allow-Origin"), F("*"));
  server.send(200, F("application/json"), doc.as<String>());
}

// ---------- API: POST /api/pi/power ----------
void handlePiPower() {
  if (server.method() != HTTP_POST) {
    server.send(405, F("application/json"), F("{\"error\":\"Method Not Allowed\"}"));
    return;
  }

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err) {
    server.send(400, F("application/json"), F("{\"error\":\"Invalid JSON\"}"));
    return;
  }

  bool on = doc["on"] | false;
  bool manual = doc["manual"] | true;

  if (on) {
    piPowerOn(manual);
    state = POWERING_PI;
    stateStartTime = millis();
  } else {
    // мягкое выключение: ждем PI_SHUTDOWN_DELAY_MS в состоянии SHUTTING_DOWN_PI,
    // чтобы дать Raspberry Pi время корректно завершить работу операционки
    if (digitalRead(PI_POWER_PIN) == LOW) {
      Serial.println(F("🔁 Soft shutdown requested via API, waiting before power off"));
      state = SHUTTING_DOWN_PI;
      stateStartTime = millis();
    } else {
      // питание уже выключено — просто обновим состояние
      state = COOLDOWN;
      stateStartTime = millis();
    }
  }

  server.sendHeader(F("Access-Control-Allow-Origin"), F("*"));
  server.send(200, F("application/json"), F("{\"ok\":true}"));
}

// ---------- API: GET /api/pi/status ----------
void handlePiStatus() {
  JsonDocument doc;
  doc["pi_power"] = (digitalRead(PI_POWER_PIN) == LOW);  // LOW = питание включено
  doc["state"]    = (int)state;
  doc["manual"]   = piPoweredByUser;

  server.sendHeader(F("Access-Control-Allow-Origin"), F("*"));
  server.send(200, F("application/json"), doc.as<String>());
}

// ---------- MIME type helper ----------
static String getMimeType(const String& path) {
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".js"))   return "application/javascript";
  if (path.endsWith(".css"))  return "text/css";
  if (path.endsWith(".png"))  return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".svg"))  return "image/svg+xml";
  if (path.endsWith(".ico"))  return "image/x-icon";
  if (path.endsWith(".woff2")) return "font/woff2";
  if (path.endsWith(".woff")) return "font/woff";
  if (path.endsWith(".ttf"))  return "font/ttf";
  if (path.endsWith(".json")) return "application/json";
  return "text/plain";
}

// ---------- Раздача файла (index.html или по пути) для onNotFound и GET / ----------
static void serveStaticOrIndex(const String& path) {
  if (!spiffsMounted) {
    server.send(503, F("text/plain"), F("SPIFFS not mounted. Run uploadfs."));
    return;
  }
  String p = path.length() > 0 ? path : F("/index.html");
  if (p == F("/")) p = F("/index.html");
  if (!SPIFFS.exists(p)) p = F("/index.html");
  if (!SPIFFS.exists(p)) {
    server.send(404, F("text/plain"), F("index.html not found. Run: npm run copy-web-to-esp32 && npm run uploadfs"));
    return;
  }
  File f = SPIFFS.open(p);
  server.streamFile(f, getMimeType(p));
  f.close();
}

// ---------- Регистрация маршрутов и раздача статики ----------
void setupApi() {
  server.on(F("/api/sensors"), HTTP_GET, handleGetSensors);
  server.on(F("/api/pi/status"), HTTP_GET, handlePiStatus);
  server.on(F("/api/pi/power"), HTTP_POST, handlePiPower);

  // Явный обработчик GET / — иначе в логах иногда "request handler not found" (браузер/кэш)
  server.on(F("/"), HTTP_GET, []() { serveStaticOrIndex(F("/")); });

  // Все остальные запросы: файл из SPIFFS или SPA-fallback на index.html
  server.onNotFound([]() { serveStaticOrIndex(server.uri()); });
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println(F("Smart Birdhouse ESP32-S3"));

  // GPIO
  pinMode(LED_PIN, OUTPUT);
  pinMode(PI_SIGNAL_PIN, OUTPUT);
  pinMode(PI_READY_PIN, INPUT);
  pinMode(PI_POWER_PIN, OUTPUT);
  pinMode(PI_MODE_PIN, OUTPUT);
  digitalWrite(PI_POWER_PIN, HIGH);
  digitalWrite(PI_SIGNAL_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  digitalWrite(PI_MODE_PIN, LOW);

  // Сначала поднимаем WiFi AP (чтобы сеть была видна даже если датчики зависнут)
  WiFi.mode(WIFI_OFF);
  delay(100);
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(ap_ip, ap_gw, ap_subnet);
  bool apOk = WiFi.softAP(ap_ssid, ap_password, 1);  // канал 1
  Serial.print(F("AP: "));
  Serial.print(ap_ip);
  Serial.print(apOk ? F(" OK") : F(" FAIL"));
  Serial.println();

  // SPIFFS: сначала монтируем без форматирования; при ошибке — форматируем один раз
  spiffsMounted = SPIFFS.begin(false);
  if (!spiffsMounted) {
    Serial.println(F("SPIFFS mount failed, formatting..."));
    spiffsMounted = SPIFFS.begin(true);
  }
  if (!spiffsMounted) Serial.println(F("❌ SPIFFS mount failed"));
  else Serial.println(F("✅ SPIFFS OK"));

  // I2C для сенсоров (retry для SHT31 — при старте от батареи I2C может быть нестабильным)
  Wire.begin(I2C_SDA, I2C_SCL);
  for (int i = 0; i < 3 && !sht31Ok; i++) {
    sht31Ok = sht31.begin(0x44);
    if (!sht31Ok) delay(200);
  }
  Serial.println(sht31Ok ? F("✅ SHT31 OK") : F("❌ SHT31 not found (temp/humidity will be 0)"));

  lox0Ok = lox.begin();
  Serial.println(lox0Ok ? F("✅ VL53L0X OK") : F("❌ VL53L0X not found"));

  // I2C для BQ25895 (addr 0x6A, SDA=17, SCL=16)
  BQWire.begin(BQ_I2C_SDA, BQ_I2C_SCL);
  BQWire.beginTransmission(BQ25895_ADDR);
  bool bqOk = (BQWire.endTransmission() == 0);
  Serial.println(bqOk ? F("✅ BQ25895 OK") : F("❌ BQ25895 not found (check I2C 17/16, addr 0x6A)"));

  // Включить непрерывный ADC (обновление раз в 1 с) — иначе BATV/ICHGR читаются как 0
  if (bqOk) {
    uint8_t adcCtrl = read8(REG_ADC_CTRL);
    adcCtrl |= 0x40;  // CONV_RATE = 1 (continuous 1s cycle)
    write8(REG_ADC_CTRL, adcCtrl);
  }

  server.begin();
  setupApi();
  Serial.println(F("✅ System Ready. Open http://192.168.4.1"));
}

void loop() {
  server.handleClient();
  updateSensors();  // не блокирует — просто проверяет таймер

  unsigned long now = millis();

  switch (state) {
    case IDLE:
      if (!piPoweredByUser && birdDetected(sensors.distance)) {
        piPowerOn(false);
        state = POWERING_PI;
        stateStartTime = now;
      }
      break;

    case POWERING_PI:
      if (digitalRead(PI_READY_PIN) == HIGH) {
        digitalWrite(PI_SIGNAL_PIN, HIGH);
        state = RECORDING;
        stateStartTime = now;
      }
      break;

    case RECORDING:
      if (digitalRead(PI_READY_PIN) == LOW) {
        Serial.println(F("🔁 Pi requested shutdown, waiting before power off"));
        state = SHUTTING_DOWN_PI;
        stateStartTime = now;
      }
      break;

    case SHUTTING_DOWN_PI:
      if (now - stateStartTime > PI_SHUTDOWN_DELAY_MS) {
        piPowerOff();
        state = COOLDOWN;
        stateStartTime = now;
      }
      break;

    case COOLDOWN:
      if (now - stateStartTime > 5000) {
        state = IDLE;
      }
      break;
  }
}
