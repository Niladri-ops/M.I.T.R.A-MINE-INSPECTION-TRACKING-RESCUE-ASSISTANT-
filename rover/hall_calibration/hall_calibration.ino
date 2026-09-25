#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

#define HALL_RIGHT 13
#define HALL_LEFT  4

#define SDA_PIN 21
#define SCL_PIN 22

const float WHEEL_CIRCUMFERENCE = 0.235f;
const int PULSES_PER_REV = 1;

Adafruit_MPU6050 mpu;
bool mpuOK = false;

unsigned long rightPulses = 0;
unsigned long leftPulses = 0;

int lastRightState;
int lastLeftState;

float speed = 0.0f;

unsigned long lastSpeedTime = 0;
float previousDistance = 0.0f;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("===== Wheel Speed + MPU6050 Diagnostics =====");

  pinMode(HALL_RIGHT, INPUT_PULLUP);
  pinMode(HALL_LEFT, INPUT_PULLUP);

  lastRightState = digitalRead(HALL_RIGHT);
  lastLeftState = digitalRead(HALL_LEFT);

  Serial.println("Starting I2C...");
  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(100000); // slower, more reliable I2C for init

  // Scan I2C bus first so we can see what's actually connected
  Serial.println("Scanning I2C bus...");
  int devicesFound = 0;
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.print("  I2C device found at 0x");
      Serial.println(addr, HEX);
      devicesFound++;
    }
  }
  if (devicesFound == 0) {
    Serial.println("  NO I2C DEVICES FOUND! Check wiring: SDA->21, SCL->22, VCC->3.3V, GND->GND");
  }

  // Try to init MPU6050 with retries instead of hanging forever
  Serial.println("Initializing MPU6050...");
  int attempts = 0;
  while (!mpuOK && attempts < 5) {
    mpuOK = mpu.begin();
    if (!mpuOK) {
      Serial.print("  MPU6050 init failed (attempt ");
      Serial.print(attempts + 1);
      Serial.println("/5). Retrying in 1s...");
      delay(1000);
      attempts++;
    }
  }

  if (!mpuOK) {
    Serial.println("  MPU6050 FAILED to initialize after 5 attempts.");
    Serial.println("  Continuing WITHOUT MPU6050 -- check wiring/power/address.");
  } else {
    Serial.println("  MPU6050 initialized successfully!");
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }

  lastSpeedTime = millis();
  Serial.println("Setup complete. Entering main loop...");
  Serial.println();
}

void loop() {

  // ---------------- HALL SENSORS ----------------

  int rightState = digitalRead(HALL_RIGHT);
  int leftState = digitalRead(HALL_LEFT);

  if (lastRightState == HIGH && rightState == LOW) {
    rightPulses++;
  }

  if (lastLeftState == HIGH && leftState == LOW) {
    leftPulses++;
  }

  lastRightState = rightState;
  lastLeftState = leftState;

  unsigned long averagePulses = (rightPulses + leftPulses) / 2;
  float revolutions = (float)averagePulses / PULSES_PER_REV;
  float distance = revolutions * WHEEL_CIRCUMFERENCE;

  // ---------------- MPU6050 (only if it initialized OK) ----------------

  float accX = 0, accY = 0, accZ = 0;
  float gyroX = 0, gyroY = 0, gyroZ = 0;

  if (mpuOK) {
    sensors_event_t acceleration;
    sensors_event_t gyro;
    sensors_event_t temp;

    mpu.getEvent(&acceleration, &gyro, &temp);

    accX = acceleration.acceleration.x;
    accY = acceleration.acceleration.y;
    accZ = acceleration.acceleration.z;
    gyroX = gyro.gyro.x;
    gyroY = gyro.gyro.y;
    gyroZ = gyro.gyro.z;
  }

  // ---------------- SPEED ----------------

  unsigned long currentTime = millis();
  float dt = (currentTime - lastSpeedTime) / 1000.0f;

  if (dt >= 0.1f) {
    float distanceChange = distance - previousDistance;
    speed = distanceChange / dt;

    if (speed < 0.0f) {
      speed = 0.0f;
    }

    previousDistance = distance;
    lastSpeedTime = currentTime;
  }

  // ---------------- TERMINAL ----------------

  static unsigned long lastPrint = 0;

  if (millis() - lastPrint >= 500) {
    lastPrint = millis();

    Serial.print("Distance: ");
    Serial.print(distance, 3);
    Serial.print(" m   Speed: ");
    Serial.print(speed, 2);
    Serial.print(" m/s   R-pulses: ");
    Serial.print(rightPulses);
    Serial.print("   L-pulses: ");
    Serial.print(leftPulses);

    if (mpuOK) {
      Serial.print("   Acc(X,Y,Z): ");
      Serial.print(accX, 2); Serial.print(",");
      Serial.print(accY, 2); Serial.print(",");
      Serial.print(accZ, 2);
      Serial.print("   Gyro(X,Y,Z): ");
      Serial.print(gyroX, 2); Serial.print(",");
      Serial.print(gyroY, 2); Serial.print(",");
      Serial.print(gyroZ, 2);
    } else {
      Serial.print("   [MPU6050 not connected]");
    }

    Serial.println();
  }

  delay(5);
}
