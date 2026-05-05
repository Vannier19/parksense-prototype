/*
 * ============================================================
 * Simple Servo Test - Parksense Gate Control
 * Untuk test apakah servo bisa gerak atau tidak
 * ============================================================
 */

#include <ESP32Servo.h>

// Pin Configuration (sesuai dengan Gate Control firmware)
#define SERVO_PIN_A 12    // GPIO12 untuk servo motor A
#define SERVO_PIN_B 13    // GPIO13 untuk servo motor B

// Servo Configuration
#define SERVO_CLOSED_ANGLE 0     // Angle tutup
#define SERVO_OPEN_ANGLE 90      // Angle buka
#define TEST_INTERVAL_MS 5000    // Gerak setiap 5 detik

// Servo objects
Servo servoA;
Servo servoB;

// Variables
unsigned long lastTestA = 0;
unsigned long lastTestB = 0;
int testCountA = 0;
int testCountB = 0;
bool isOpenA = false;
bool isOpenB = false;

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n========================================");
  Serial.println("🔧 Simple Servo Test");
  Serial.println("========================================\n");

  // Attach servo A
  Serial.print("Attaching Servo A to GPIO12... ");
  servoA.attach(SERVO_PIN_A);
  servoA.write(SERVO_CLOSED_ANGLE);
  Serial.println("✅ OK");

  // Attach servo B
  Serial.print("Attaching Servo B to GPIO13... ");
  servoB.attach(SERVO_PIN_B);
  servoB.write(SERVO_CLOSED_ANGLE);
  Serial.println("✅ OK");

  Serial.println("\n✅ Setup complete!");
  Serial.println("Servo akan gerak setiap 5 detik.\n");
}

void loop() {
  // Test Servo A
  if (millis() - lastTestA >= TEST_INTERVAL_MS) {
    testCountA++;
    lastTestA = millis();
    isOpenA = !isOpenA;

    Serial.print("\n🔄 Test Servo A - Count: ");
    Serial.print(testCountA);
    Serial.print(" | Angle: ");

    if (isOpenA) {
      servoA.write(SERVO_OPEN_ANGLE);
      Serial.print(SERVO_OPEN_ANGLE);
      Serial.println("° (OPEN)");
    } else {
      servoA.write(SERVO_CLOSED_ANGLE);
      Serial.print(SERVO_CLOSED_ANGLE);
      Serial.println("° (CLOSED)");
    }
  }

  // Test Servo B
  if (millis() - lastTestB >= TEST_INTERVAL_MS) {
    testCountB++;
    lastTestB = millis();
    isOpenB = !isOpenB;

    Serial.print("🔄 Test Servo B - Count: ");
    Serial.print(testCountB);
    Serial.print(" | Angle: ");

    if (isOpenB) {
      servoB.write(SERVO_OPEN_ANGLE);
      Serial.print(SERVO_OPEN_ANGLE);
      Serial.println("° (OPEN)");
    } else {
      servoB.write(SERVO_CLOSED_ANGLE);
      Serial.print(SERVO_CLOSED_ANGLE);
      Serial.println("° (CLOSED)");
    }
  }

  delay(100);
}

/*
 * ============================================================
 * EXPECTED OUTPUT:
 * 
 * ========================================
 * 🔧 Simple Servo Test
 * ========================================
 * 
 * Attaching Servo A to GPIO12... ✅ OK
 * Attaching Servo B to GPIO13... ✅ OK
 * 
 * ✅ Setup complete!
 * Servo akan gerak setiap 5 detik.
 * 
 * 🔄 Test Servo A - Count: 1 | Angle: 90° (OPEN)
 * 🔄 Test Servo B - Count: 1 | Angle: 90° (OPEN)
 * 
 * 🔄 Test Servo A - Count: 2 | Angle: 0° (CLOSED)
 * 🔄 Test Servo B - Count: 2 | Angle: 0° (CLOSED)
 * 
 * ... repeats ...
 * 
 * ============================================================
 * TROUBLESHOOTING:
 * 
 * ❌ "error: #error This library only supports boards..."
 *    → Pastikan sudah install ESP32Servo library
 * 
 * ❌ Servo tidak gerak
 *    → Check pin configuration (GPIO12, GPIO13)
 *    → Check power supply untuk servo (5V, min 500mA)
 *    → Check servo connector (GND, 5V, SIGNAL)
 * 
 * ❌ Servo gerak tapi jitter/tidak stabil
 *    → Power supply tidak stabil
 *    → Gunakan external power supply, bukan USB saja
 * 
 * ✅ Servo gerak smooth
 *    → Hardware OK! Lanjut ke full firmware
 * ============================================================
 */
