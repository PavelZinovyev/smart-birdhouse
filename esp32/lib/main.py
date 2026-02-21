#include <Wire.h>
#include "Adafruit_SHT31.h"
#include "Adafruit_VL53L0X.h"

#define I2C_SDA 21
#define I2C_SCL 20
#define PI_SIGNAL_PIN 6   // сигнал на Pi о движении
#define PI_READY_PIN 4    // сигнал от Pi: HIGH = готов к записи, LOW = можно выключать питание
#define PI_POWER_PIN 5    // управление MOSFET
#define LED_PIN 7

Adafruit_SHT31 sht31 = Adafruit_SHT31();
Adafruit_VL53L0X lox = Adafruit_VL53L0X();

// ---------------- settings ----------------
const int BIRD_TRIGGER_DISTANCE = 50;   // мм — птица внутри
const int STABLE_COUNT_REQUIRED = 2;    // сколько стабильных показаний подряд

// ---------------- states ----------------
enum SystemState {
  IDLE,
  POWERING_PI,
  RECORDING,
  COOLDOWN
};

SystemState state = IDLE;
unsigned long stateStartTime = 0;
int stableCounter = 0;

// ---------- power on Pi ----------
void piPowerOn() {
  Serial.println("⚡ PI POWER ON");
  digitalWrite(LED_PIN, HIGH);
  digitalWrite(PI_POWER_PIN, LOW);   // LOW открывает P-MOSFET → Pi получает 5V
}

void piPowerOff() {
  Serial.println("🔌 PI POWER OFF");
  digitalWrite(LED_PIN, LOW);
  digitalWrite(PI_POWER_PIN, HIGH);  // HIGH закрывает MOSFET → Pi отключён
}

// ---------- measure distance ----------
int readDistanceMM() {
  VL53L0X_RangingMeasurementData_t measure;
  lox.rangingTest(&measure, false);
  if (measure.RangeStatus != 4) return measure.RangeMilliMeter;
  return -1;
}

// ---------- filter distance ----------
int getFilteredDistance() {
  const int samples = 5;
  int sum = 0;
  int valid = 0;

  for (int i = 0; i < samples; i++) {
    int d = readDistanceMM();
    if (d > 0) {
      sum += d;
      valid++;
    }
    delay(30);
  }
  if (valid == 0) return -1;
  return sum / valid;
}

// ---------- check bird ----------
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

// ================= setup =================
void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(LED_PIN, OUTPUT);
  pinMode(PI_SIGNAL_PIN, OUTPUT);
  pinMode(PI_READY_PIN, INPUT);

  pinMode(PI_POWER_PIN, OUTPUT);   // FIX
  digitalWrite(PI_POWER_PIN, HIGH); // FIX → MOSFET закрыт при старте

  digitalWrite(LED_PIN, LOW);
  digitalWrite(PI_SIGNAL_PIN, LOW);

  Wire.begin(I2C_SDA, I2C_SCL);

  if (!sht31.begin(0x44)) {
    Serial.println("❌ SHT31 not found");
    while (1);
  }

  if (!lox.begin()) {
    Serial.println("❌ VL53L0X not found");
    while (1);
  }

  Serial.println("✅ System Ready");
}

// ================= loop =================
void loop() {
  unsigned long now = millis();

  // ---------- temperature and humidity ----------
  float temp = sht31.readTemperature();
  float hum  = sht31.readHumidity();
  if (!isnan(temp) && !isnan(hum)) {
    Serial.print("🌡 "); Serial.print(temp);
    Serial.print(" °C | 💧 "); Serial.print(hum);
    Serial.println(" %");
  }

  // ---------- distance ----------
  int distance = getFilteredDistance();
  Serial.print("📏 Distance: "); Serial.println(distance);

  // ================= state machine =================
  switch (state) {

    case IDLE:
      Serial.println("STATE: IDLE");
      if (birdDetected(distance)) {
        Serial.println("🐦 BIRD DETECTED, POWERING PI");
        piPowerOn();
        state = POWERING_PI;
        stateStartTime = now;
      }
      break;

    case POWERING_PI:
      Serial.println("STATE: POWERING_PI");

      if (digitalRead(PI_READY_PIN) == HIGH) {
        Serial.println("✅ PI READY, START RECORDING");

        digitalWrite(PI_SIGNAL_PIN, HIGH);   // signal to Pi to start recording

        state = RECORDING;
        stateStartTime = now;
      }
      break;

    case RECORDING:
      Serial.println("STATE: RECORDING");
      Serial.print("PI_READY_PIN = ");
      Serial.println(digitalRead(PI_READY_PIN));

      if (digitalRead(PI_READY_PIN) == LOW) {
        Serial.println("⏹ PI finished recording/conversion, POWER OFF");
        piPowerOff();
        state = COOLDOWN;
        stateStartTime = now;
      }
      break;

    case COOLDOWN:
      Serial.println("STATE: COOLDOWN");
      if (now - stateStartTime >= 5000) {
        Serial.println("✅ READY AGAIN");
        state = IDLE;
      }
      break;
  }

  Serial.println("------------------------");
  delay(500);
}
