#include <Wire.h>
#include "Adafruit_SHT31.h"
#include "Adafruit_VL53L0X.h"

// ---------- PINS ----------
#define PI_SIGNAL_PIN 6
#define PI_READY_PIN 4
#define PI_POWER_PIN 5
#define PI_MODE_PIN 8
#define LED_PIN 7

#define I2C_SDA 21
#define I2C_SCL 20

// ---------- SENSORS ----------
Adafruit_SHT31 sht31 = Adafruit_SHT31();
Adafruit_VL53L0X lox = Adafruit_VL53L0X();

// ---------- SETTINGS ----------
const int BIRD_TRIGGER_DISTANCE = 50;
const int STABLE_COUNT_REQUIRED = 2;

// ---------- STATES ----------
enum SystemState {
  IDLE,
  POWERING_PI,
  RECORDING,
  COOLDOWN
};

SystemState state = IDLE;
unsigned long stateStartTime = 0;
int stableCounter = 0;

// ---------- POWER ----------
void piPowerOn(bool manualMode) {
  Serial.println("⚡ PI POWER ON");

  if (manualMode)
    digitalWrite(PI_MODE_PIN, HIGH);
  else
    digitalWrite(PI_MODE_PIN, LOW);

  digitalWrite(LED_PIN, HIGH);
  digitalWrite(PI_POWER_PIN, LOW);
}

void piPowerOff() {
  Serial.println("🔌 PI POWER OFF");
  digitalWrite(LED_PIN, LOW);
  digitalWrite(PI_POWER_PIN, HIGH);
}

// ---------- DISTANCE ----------
int readDistanceMM() {
  VL53L0X_RangingMeasurementData_t measure;
  lox.rangingTest(&measure, false);
  if (measure.RangeStatus != 4) return measure.RangeMilliMeter;
  return -1;
}

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

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(LED_PIN, OUTPUT);
  pinMode(PI_SIGNAL_PIN, OUTPUT);
  pinMode(PI_READY_PIN, INPUT);

  pinMode(PI_POWER_PIN, OUTPUT);
  pinMode(PI_MODE_PIN, OUTPUT);

  digitalWrite(PI_POWER_PIN, HIGH);
  digitalWrite(PI_SIGNAL_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  digitalWrite(PI_MODE_PIN, LOW);

  Wire.begin(I2C_SDA, I2C_SCL);

  sht31.begin(0x44);
  lox.begin();

  Serial.println("✅ System Ready");
}

// ================= LOOP =================
void loop() {
  unsigned long now = millis();

  float temp = sht31.readTemperature();
  float hum  = sht31.readHumidity();
  int distance = getFilteredDistance();

  // ---------- DEBUG LOG ----------
  Serial.print("🌡 ");
  Serial.print(temp);
  Serial.print(" °C  |  💧 ");
  Serial.print(hum);
  Serial.print(" %  |  📏 ");
  Serial.print(distance);
  Serial.print(" mm  |  STATE: ");
  Serial.println(state);

  switch (state) {

    case IDLE:
      Serial.println("STATE: IDLE");

      if (birdDetected(distance)) {
        Serial.println("🐦 BIRD DETECTED");
        piPowerOn(false); // AUTO MODE
        state = POWERING_PI;
        stateStartTime = now;
      }
      break;

    case POWERING_PI:
      Serial.println("STATE: POWERING_PI");

      if (digitalRead(PI_READY_PIN) == HIGH) {
        Serial.println("✅ PI READY → RECORD");

        digitalWrite(PI_SIGNAL_PIN, HIGH);

        state = RECORDING;
        stateStartTime = now;
      }
      break;

    case RECORDING:
      Serial.println("STATE: RECORDING");

      if (digitalRead(PI_READY_PIN) == LOW) {
        Serial.println("⏹ RECORD FINISHED → POWER OFF");
        piPowerOff();
        state = COOLDOWN;
        stateStartTime = now;
      }
      break;

    case COOLDOWN:
      Serial.println("STATE: COOLDOWN");

      if (now - stateStartTime > 5000) {
        Serial.println("✅ BACK TO IDLE");
        state = IDLE;
      }
      break;
  }

  Serial.println("------------------------");
  delay(500);
}
