/**
 * Smart Birdhouse — ESP32-S3 N16R8
 *
 * - WiFi AP: точка доступа для телефона
 * - HTTP-сервер: раздаёт фронтенд (SPIFFS) + JSON API
 * - API: GET /api/sensors, POST /api/pi/power
 * - Датчики: SHT31 (temp/humidity), VL53L0X (distance), батарея (ADC)
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
#define BATTERY_ADC_PIN 1   // ADC1_CH0, напряжение через делитель (подстроить под схему)
#define I2C_SDA         21
#define I2C_SCL         20

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

// ---------- Settings ----------
const int BIRD_TRIGGER_DISTANCE = 50;
const int STABLE_COUNT_REQUIRED = 2;
// Батарея: калибровка под делитель (например 2:1 → 3.3V max = 6.6V на батарее)
const float BATTERY_VOLTAGE_MAX = 4.2f;
const float BATTERY_VOLTAGE_MIN = 3.0f;

// ---------- State ----------
enum SystemState {
  IDLE,
  POWERING_PI,
  RECORDING,
  COOLDOWN
};
SystemState state = IDLE;
unsigned long stateStartTime = 0;
int stableCounter = 0;

// Ручное включение Pi (с фронта) — не запускаем авто-запись по птице
bool piPoweredByUser = false;

WebServer server(80);
static bool spiffsMounted = false;

// ---------- Battery (ADC) ----------
// Без делителя напряжения на BATTERY_ADC_PIN заряд не измерить: ESP32 питается от 3.3V
// и не видит напряжение банки. Если пин не подключён — raw ≈ 0, считаем "датчика нет".
#define BATTERY_ADC_RAW_MIN  30   // ниже = считаем "датчик не подключён"
#define BATTERY_ADC_SAMPLES  8   // усреднение для уменьшения скачков

int getBatteryRaw() {
  long sum = 0;
  for (int i = 0; i < BATTERY_ADC_SAMPLES; i++) {
    sum += analogRead(BATTERY_ADC_PIN);
    delay(2);
  }
  return (int)(sum / BATTERY_ADC_SAMPLES);
}

int getBatteryPercent() {
  int raw = getBatteryRaw();
  if (raw < BATTERY_ADC_RAW_MIN) return 0;  // не подключён или обрыв
  // V_adc = 0..3.3V. Делитель R1=20k, R2=47k: V_bat = V_adc * (20+47)/47
  float v = (3.3f / 4095.0f) * (float)raw;
  float vBat = v * (20.0f + 47.0f) / 47.0f;
  if (vBat >= BATTERY_VOLTAGE_MAX) return 100;
  if (vBat <= BATTERY_VOLTAGE_MIN) return 0;
  return (int)((vBat - BATTERY_VOLTAGE_MIN) / (BATTERY_VOLTAGE_MAX - BATTERY_VOLTAGE_MIN) * 100.0f);
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
  float temp = sht31.readTemperature();
  float hum  = sht31.readHumidity();
  int distance = getFilteredDistance();
  int battery = getBatteryPercent();

  if (isnan(temp)) temp = 0.0f;
  if (isnan(hum))  hum = 0.0f;

  bool batteryAvailable = (getBatteryRaw() >= BATTERY_ADC_RAW_MIN);

  JsonDocument doc;
  doc["temperature"] = round(temp * 10) / 10.0;
  doc["humidity"]    = round(hum * 10) / 10.0;
  doc["battery"]     = battery;
  doc["battery_available"] = batteryAvailable;
  doc["distance_mm"] = distance;

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
    piPowerOff();
    state = COOLDOWN;
    stateStartTime = millis();
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

// ---------- Serve static file or SPA fallback ----------
// В Arduino ESP32 SPIFFS.open() ожидает путь с ведущим /
static String toSpiffsPath(const String& path) {
  if (path.length() == 0) return String(F("/index.html"));
  if (path[0] != '/') return String('/') + path;
  return path;
}

bool serveFile(const String& path) {
  if (!spiffsMounted) return false;
  String p = toSpiffsPath(path);
  if (p == "/") p = "/index.html";
  if (!SPIFFS.exists(p)) return false;
  File f = SPIFFS.open(p, "r");
  if (!f) return false;
  String contentType = F("text/plain");
  if (p.endsWith(".html")) contentType = F("text/html");
  else if (p.endsWith(".css"))  contentType = F("text/css");
  else if (p.endsWith(".js"))   contentType = F("application/javascript");
  else if (p.endsWith(".ico"))  contentType = F("image/x-icon");
  else if (p.endsWith(".png"))  contentType = F("image/png");
  else if (p.endsWith(".svg"))  contentType = F("image/svg+xml");
  else if (p.endsWith(".json")) contentType = F("application/json");
  server.streamFile(f, contentType);
  f.close();
  return true;
}

// Отладка: список файлов в SPIFFS (открой в браузере http://192.168.4.1/api/debug/spiffs)
void handleDebugSpiffs() {
  if (!spiffsMounted) {
    server.send(503, F("application/json"), F("{\"error\":\"SPIFFS not mounted\"}"));
    return;
  }
  JsonDocument doc;
  JsonArray arr = doc.to<JsonArray>();
  File root = SPIFFS.open("/");
  if (root) {
    File f = root.openNextFile();
    while (f && arr.size() < 50) {
      arr.add(f.path());
      f = root.openNextFile();
    }
    root.close();
  }
  server.sendHeader(F("Access-Control-Allow-Origin"), F("*"));
  server.send(200, F("application/json"), doc.as<String>());
}

void handleNotFound() {
  String path = server.uri();
  // Убрать query string
  int q = path.indexOf('?');
  if (q >= 0) path = path.substring(0, q);
  if (path == "/" || path.length() == 0) path = "/index.html";

  if (serveFile(path)) return;
  if (serveFile("/index.html")) return;

  if (!spiffsMounted) {
    server.send(503, F("text/plain"), F("SPIFFS not mounted. Run: npm run copy-web-to-esp32, then npm run uploadfs, then npm run upload."));
    return;
  }
  server.send(404, F("text/plain"), F("Not found"));
}

void setupApi() {
  server.on(F("/api/sensors"), HTTP_GET, handleGetSensors);
  server.on(F("/api/pi/power"), HTTP_POST, handlePiPower);
  server.on(F("/api/pi/status"), HTTP_GET, handlePiStatus);
  server.on(F("/api/debug/spiffs"), HTTP_GET, handleDebugSpiffs);
  server.onNotFound(handleNotFound);
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

  // SPIFFS (раздел spiffs из partitions.csv). Без монтирования не вызываем exists/open — будет ошибка "File system is not mounted".
  spiffsMounted = SPIFFS.begin(true, "spiffs");
  if (!spiffsMounted) {
    spiffsMounted = SPIFFS.begin(true);  // попробовать раздел по умолчанию
  }
  if (!spiffsMounted) {
    Serial.println(F("❌ SPIFFS mount failed (run uploadfs after upload?)"));
  } else {
    Serial.println(F("✅ SPIFFS OK"));
  }

  Wire.begin(I2C_SDA, I2C_SCL);
  if (!sht31.begin(0x44)) {
    Serial.println(F("❌ SHT31 not found"));
  }
  if (!lox.begin()) {
    Serial.println(F("❌ VL53L0X not found"));
  }

  server.begin();
  setupApi();
  Serial.println(F("✅ System Ready. Open http://192.168.4.1"));
}

void loop() {
  unsigned long now = millis();

  server.handleClient();

  // ---------- Sensors (для API и лога) ----------
  float temp = sht31.readTemperature();
  float hum  = sht31.readHumidity();
  int distance = getFilteredDistance();

  // ---------- State machine ----------
  switch (state) {
    case IDLE:
      if (!piPoweredByUser && birdDetected(distance)) {
        Serial.println(F("🐦 BIRD DETECTED"));
        piPowerOn(false);
        state = POWERING_PI;
        stateStartTime = now;
      }
      break;

    case POWERING_PI:
      if (digitalRead(PI_READY_PIN) == HIGH) {
        Serial.println(F("✅ PI READY → RECORD"));
        digitalWrite(PI_SIGNAL_PIN, HIGH);
        state = RECORDING;
        stateStartTime = now;
      }
      break;

    case RECORDING:
      if (digitalRead(PI_READY_PIN) == LOW) {
        Serial.println(F("⏹ RECORD FINISHED → POWER OFF"));
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

  delay(100);
}
