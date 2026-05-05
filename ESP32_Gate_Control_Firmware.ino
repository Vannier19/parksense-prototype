/*
 * ============================================================
 * Parksense - Gate Control System (Dual Gate)
 * ESP32 Firmware untuk Kontrol 2 Gerbang dengan 2 Ultrasonic
 * 
 * Hardware:
 * - ESP32 DevKit
 * - 2x Sensor Ultrasonik HC-SR04 (deteksi kendaraan)
 * - 2x Servo Motor (kontrol buka/tutup 2 gerbang)
 * ============================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// ============================================================
// KONFIGURASI
// ============================================================

// WiFi Configuration
const char* SSID = "AndroidAP_8539";
const char* PASSWORD = "reooooooo";

// MQTT Configuration
const char* MQTT_BROKER = "broker.hivemq.com";
const int MQTT_PORT = 1883;

// MQTT Topics - Gate A
const char* MQTT_COMMAND_TOPIC_A = "parksense/gate/gate_a/command"; // Subscriber topic
const char* MQTT_STATUS_TOPIC_A = "parksense/gate/gate_a/status";   // Publisher topic

// MQTT Topics - Gate B
const char* MQTT_COMMAND_TOPIC_B = "parksense/gate/gate_b/command"; // Subscriber topic
const char* MQTT_STATUS_TOPIC_B = "parksense/gate/gate_b/status";   // Publisher topic

// Hardware Pins - Gate A (Gerbang A)
#define TRIGGER_PIN_B 25    // GPIO26 untuk trigger sensor ultrasonik A
#define ECHO_PIN_B 26       // GPIO25 untuk echo sensor ultrasonik A
#define SERVO_PIN_A 12      // GPIO12 untuk servo motor A

// Hardware Pins - Gate B (Gerbang B)
#define TRIGGER_PIN_A 14    // GPIO14 untuk trigger sensor ultrasonik B
#define ECHO_PIN_A 27       // GPIO27 untuk echo sensor ultrasonik B
#define SERVO_PIN_B 13      // GPIO13 untuk servo motor B

// Sensor Configuration
#define SOUND_SPEED 0.034   // cm/us (kecepatan suara di udara)
#define ULTRASONIC_THRESHOLD_CM 100  // Jarak threshold untuk deteksi kendaraan (cm)
#define CONSECUTIVE_DETECTIONS 3     // Berapa kali harus terdeteksi sebelum dianggap ada mobil

// Servo Configuration
#define SERVO_CLOSED_ANGLE 0    // Angle ketika gerbang tutup
#define SERVO_OPEN_ANGLE 90     // Angle ketika gerbang buka
#define GATE_OPEN_DURATION_MS 10000  // Berapa lama gerbang terbuka (ms)

// ============================================================
// GLOBAL VARIABLES
// ============================================================
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// Servo objects - 2 gates
Servo gateServoA;
Servo gateServoB;

// Vehicle detection - Gate A
int vehicleDetectionCountA = 0;
bool vehicleDetectedA = false;
unsigned long lastVehicleDetectionTimeA = 0;

// Vehicle detection - Gate B
int vehicleDetectionCountB = 0;
bool vehicleDetectedB = false;
unsigned long lastVehicleDetectionTimeB = 0;

// Gate control - Gate A
bool gateOpenRequestedA = false;
unsigned long gateOpenTimeA = 0;
bool gateCurrentlyOpenA = false;

// Gate control - Gate B
bool gateOpenRequestedB = false;
unsigned long gateOpenTimeB = 0;
bool gateCurrentlyOpenB = false;

// Status variables
String systemStatusA = "IDLE";
String systemStatusB = "IDLE";
unsigned long lastMQTTPublishA = 0;
unsigned long lastMQTTPublishB = 0;

// Dummy QR Simulation variables
bool enableDummyQRSimulation = true;  // Toggle dummy QR on/off
unsigned long lastDummyQRScanA = 0;
unsigned long lastDummyQRScanB = 0;
unsigned long dummyQRIntervalMS = 15000;  // Trigger setiap 15 detik
int dummyQRScanCounterA = 0;
int dummyQRScanCounterB = 0;

// ============================================================
// FUNCTION: Simulate Dummy QR Scan - Gate A
// ============================================================
void simulateDummyQRScanA() {
  if (!enableDummyQRSimulation) return;
  if (millis() - lastDummyQRScanA < dummyQRIntervalMS) return;

  dummyQRScanCounterA++;
  lastDummyQRScanA = millis();

  Serial.println("\n🎯 === DUMMY QR SCAN SIMULATION - GATE A ===");
  Serial.print("   Scan Count: ");
  Serial.println(dummyQRScanCounterA);

  // Trigger Gate A open
  gateOpenRequestedA = true;
  gateOpenTimeA = millis();
  systemStatusA = "AWAITING_VEHICLE";

  Serial.println("   ✅ Gate A command triggered (waiting for vehicle)");
}

// ============================================================
// FUNCTION: Simulate Dummy QR Scan - Gate B
// ============================================================
void simulateDummyQRScanB() {
  if (!enableDummyQRSimulation) return;
  if (millis() - lastDummyQRScanB < dummyQRIntervalMS) return;

  dummyQRScanCounterB++;
  lastDummyQRScanB = millis();

  Serial.println("\n🎯 === DUMMY QR SCAN SIMULATION - GATE B ===");
  Serial.print("   Scan Count: ");
  Serial.println(dummyQRScanCounterB);

  // Trigger Gate B open
  gateOpenRequestedB = true;
  gateOpenTimeB = millis();
  systemStatusB = "AWAITING_VEHICLE";

  Serial.println("   ✅ Gate B command triggered (waiting for vehicle)");
}

// ============================================================
// FUNCTION: Handle Serial Commands for Testing
// ============================================================
void handleSerialCommand() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toLowerCase();

    if (command == "test_a") {
      Serial.println("\n🧪 Manual Test: Triggering Gate A...");
      simulateDummyQRScanA();
    }
    else if (command == "test_b") {
      Serial.println("\n🧪 Manual Test: Triggering Gate B...");
      simulateDummyQRScanB();
    }
    else if (command == "test_both") {
      Serial.println("\n🧪 Manual Test: Triggering Both Gates...");
      simulateDummyQRScanA();
      delay(1000);
      simulateDummyQRScanB();
    }
    else if (command == "auto_on") {
      enableDummyQRSimulation = true;
      Serial.println("✅ Automatic QR simulation: ON (every 15 seconds)");
    }
    else if (command == "auto_off") {
      enableDummyQRSimulation = false;
      Serial.println("❌ Automatic QR simulation: OFF");
    }
    else if (command == "status") {
      Serial.println("\n📊 === CURRENT STATUS ===");
      Serial.print("   Gate A: ");
      Serial.print(gateCurrentlyOpenA ? "OPEN" : "CLOSED");
      Serial.print(" | Status: ");
      Serial.println(systemStatusA);
      Serial.print("   Gate B: ");
      Serial.print(gateCurrentlyOpenB ? "OPEN" : "CLOSED");
      Serial.print(" | Status: ");
      Serial.println(systemStatusB);
      Serial.print("   Auto QR Simulation: ");
      Serial.println(enableDummyQRSimulation ? "ON" : "OFF");
      Serial.print("   Scans (A/B): ");
      Serial.print(dummyQRScanCounterA);
      Serial.print("/");
      Serial.println(dummyQRScanCounterB);
    }
    else if (command == "help") {
      Serial.println("\n📖 === AVAILABLE COMMANDS ===");
      Serial.println("   test_a   → Trigger Gate A manually");
      Serial.println("   test_b   → Trigger Gate B manually");
      Serial.println("   test_both → Trigger both gates");
      Serial.println("   auto_on  → Enable automatic QR simulation (every 15s)");
      Serial.println("   auto_off → Disable automatic QR simulation");
      Serial.println("   status   → Show current system status");
      Serial.println("   help     → Show this help message");
    }
    else {
      Serial.println("❓ Unknown command. Type 'help' untuk list commands.");
    }
  }
}

// ============================================================
// FUNCTION: Setup WiFi Connection
// ============================================================
void setupWiFi() {
  Serial.println("\n\n🔌 Connecting to WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ Failed to connect to WiFi");
  }
}

// ============================================================
// FUNCTION: MQTT Callback - Handle incoming messages
// ============================================================
void onMQTTMessage(char* topic, byte* payload, unsigned int length) {
  // Convert payload ke string
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println("\n📨 MQTT Message Received:");
  Serial.print("   Topic: ");
  Serial.println(topic);
  Serial.print("   Payload: ");
  Serial.println(message);

  // Parse JSON
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.print("❌ Failed to parse JSON: ");
    Serial.println(error.f_str());
    return;
  }

  // Tentukan gate mana yang diminta
  bool isGateA = String(topic) == MQTT_COMMAND_TOPIC_A;
  bool isGateB = String(topic) == MQTT_COMMAND_TOPIC_B;

  if (!isGateA && !isGateB) {
    Serial.println("❌ Unknown gate topic");
    return;
  }

  // Cek action
  if (doc["action"] == "OPEN_GATE") {
    Serial.println("🔓 OPEN_GATE command received!");
    
    int allowedDuration = doc["allowedDurationSeconds"] | 10;
    String userId = doc["userId"].as<String>();
    String plate = doc["plate"].as<String>();

    Serial.print("   User: ");
    Serial.println(userId);
    Serial.print("   Plate: ");
    Serial.println(plate);
    Serial.print("   Duration: ");
    Serial.print(allowedDuration);
    Serial.println(" seconds");

    if (isGateA) {
      gateOpenRequestedA = true;
      gateOpenTimeA = millis();
      systemStatusA = "AWAITING_VEHICLE";
      Serial.println("   → Gate A command set");
    } else if (isGateB) {
      gateOpenRequestedB = true;
      gateOpenTimeB = millis();
      systemStatusB = "AWAITING_VEHICLE";
      Serial.println("   → Gate B command set");
    }
  } else if (doc["action"] == "CLOSE_GATE") {
    Serial.println("🔒 CLOSE_GATE command received!");
    if (isGateA) {
      closeGateA();
    } else if (isGateB) {
      closeGateB();
    }
  }
}

// ============================================================
// FUNCTION: Setup MQTT Connection
// ============================================================
void setupMQTT() {
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(onMQTTMessage);

  Serial.println("\n🔌 Connecting to MQTT Broker...");
  
  // Generate unique client ID
  String clientID = "ESP32_DualGate_" + String(random(10000));
  
  if (mqttClient.connect(clientID.c_str())) {
    Serial.println("✅ MQTT Connected!");
    Serial.print("   Client ID: ");
    Serial.println(clientID);

    // Subscribe ke gate command topics
    if (mqttClient.subscribe(MQTT_COMMAND_TOPIC_A)) {
      Serial.print("✅ Subscribed to: ");
      Serial.println(MQTT_COMMAND_TOPIC_A);
    } else {
      Serial.println("❌ Failed to subscribe to Gate A topic");
    }

    if (mqttClient.subscribe(MQTT_COMMAND_TOPIC_B)) {
      Serial.print("✅ Subscribed to: ");
      Serial.println(MQTT_COMMAND_TOPIC_B);
    } else {
      Serial.println("❌ Failed to subscribe to Gate B topic");
    }
  } else {
    Serial.print("❌ MQTT Connection failed. State: ");
    Serial.println(mqttClient.state());
  }
}

// ============================================================
// FUNCTION: Publish Status ke MQTT - Gate A
// ============================================================
void publishStatusA() {
  StaticJsonDocument<256> doc;
  doc["gate"] = "Gate_A";
  doc["status"] = gateCurrentlyOpenA ? "OPEN" : "CLOSED";
  doc["systemStatus"] = systemStatusA;
  doc["vehicleDetected"] = vehicleDetectedA;
  doc["timestamp"] = millis();

  String jsonString;
  serializeJson(doc, jsonString);

  if (mqttClient.publish(MQTT_STATUS_TOPIC_A, jsonString.c_str())) {
    Serial.println("📡 Status A published to MQTT");
  } else {
    Serial.println("❌ Failed to publish status A");
  }
}

// ============================================================
// FUNCTION: Publish Status ke MQTT - Gate B
// ============================================================
void publishStatusB() {
  StaticJsonDocument<256> doc;
  doc["gate"] = "Gate_B";
  doc["status"] = gateCurrentlyOpenB ? "OPEN" : "CLOSED";
  doc["systemStatus"] = systemStatusB;
  doc["vehicleDetected"] = vehicleDetectedB;
  doc["timestamp"] = millis();

  String jsonString;
  serializeJson(doc, jsonString);

  if (mqttClient.publish(MQTT_STATUS_TOPIC_B, jsonString.c_str())) {
    Serial.println("📡 Status B published to MQTT");
  } else {
    Serial.println("❌ Failed to publish status B");
  }
}

// ============================================================
// FUNCTION: Baca sensor ultrasonik A - hitung jarak
// ============================================================
float getUltrasonicDistanceA() {
  // Set trigger pin LOW terlebih dahulu
  digitalWrite(TRIGGER_PIN_A, LOW);
  delayMicroseconds(2);

  // Send pulse: trigger pin HIGH for 10 microseconds
  digitalWrite(TRIGGER_PIN_A, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER_PIN_A, LOW);

  // Baca pulse duration di echo pin
  long duration = pulseIn(ECHO_PIN_A, HIGH, 30000); // timeout 30ms

  // Hitung jarak (cm)
  float distance = duration * SOUND_SPEED / 2;

  return distance;
}

// ============================================================
// FUNCTION: Baca sensor ultrasonik B - hitung jarak
// ============================================================
float getUltrasonicDistanceB() {
  // Set trigger pin LOW terlebih dahulu
  digitalWrite(TRIGGER_PIN_B, LOW);
  delayMicroseconds(2);

  // Send pulse: trigger pin HIGH for 10 microseconds
  digitalWrite(TRIGGER_PIN_B, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER_PIN_B, LOW);

  // Baca pulse duration di echo pin
  long duration = pulseIn(ECHO_PIN_B, HIGH, 30000); // timeout 30ms

  // Hitung jarak (cm)
  float distance = duration * SOUND_SPEED / 2;

  return distance;
}

// ============================================================
// FUNCTION: Deteksi kendaraan - Gate A
// ============================================================
void detectVehicleA() {
  float distance = getUltrasonicDistanceA();

  // Hanya tampilkan log setiap 1 detik
  static unsigned long lastLog = 0;
  if (millis() - lastLog > 1000) {
    Serial.print("📏 Ultrasonic Distance (A): ");
    Serial.print(distance);
    Serial.println(" cm");
    lastLog = millis();
  }

  // Deteksi: jika jarak kurang dari threshold, berarti ada kendaraan
  if (distance < ULTRASONIC_THRESHOLD_CM && distance > 0) {
    vehicleDetectionCountA++;
    
    if (vehicleDetectionCountA >= CONSECUTIVE_DETECTIONS) {
      if (!vehicleDetectedA) {
        vehicleDetectedA = true;
        lastVehicleDetectionTimeA = millis();
        systemStatusA = "VEHICLE_DETECTED";
        Serial.println("🚗 VEHICLE DETECTED AT GATE A!");
      }
    }
  } else {
    // Tidak ada kendaraan
    vehicleDetectionCountA = 0;
    
    // Jika sebelumnya ada kendaraan, sekarang hilang
    if (vehicleDetectedA && millis() - lastVehicleDetectionTimeA > 5000) {
      vehicleDetectedA = false;
      systemStatusA = "IDLE";
      Serial.println("🔍 Vehicle no longer detected at Gate A");
      
      // Close gate jika masih terbuka
      if (gateCurrentlyOpenA) {
        closeGateA();
      }
    }
  }
}

// ============================================================
// FUNCTION: Deteksi kendaraan - Gate B
// ============================================================
void detectVehicleB() {
  float distance = getUltrasonicDistanceB();

  // Hanya tampilkan log setiap 1 detik
  static unsigned long lastLog = 0;
  if (millis() - lastLog > 1000) {
    Serial.print("📏 Ultrasonic Distance (B): ");
    Serial.print(distance);
    Serial.println(" cm");
    lastLog = millis();
  }

  // Deteksi: jika jarak kurang dari threshold, berarti ada kendaraan
  if (distance < ULTRASONIC_THRESHOLD_CM && distance > 0) {
    vehicleDetectionCountB++;
    
    if (vehicleDetectionCountB >= CONSECUTIVE_DETECTIONS) {
      if (!vehicleDetectedB) {
        vehicleDetectedB = true;
        lastVehicleDetectionTimeB = millis();
        systemStatusB = "VEHICLE_DETECTED";
        Serial.println("🚗 VEHICLE DETECTED AT GATE B!");
      }
    }
  } else {
    // Tidak ada kendaraan
    vehicleDetectionCountB = 0;
    
    // Jika sebelumnya ada kendaraan, sekarang hilang
    if (vehicleDetectedB && millis() - lastVehicleDetectionTimeB > 5000) {
      vehicleDetectedB = false;
      systemStatusB = "IDLE";
      Serial.println("🔍 Vehicle no longer detected at Gate B");
      
      // Close gate jika masih terbuka
      if (gateCurrentlyOpenB) {
        closeGateB();
      }
    }
  }
}

// ============================================================
// FUNCTION: Buka gerbang A (servo -> OPEN angle)
// ============================================================
void openGateA() {
  if (!gateCurrentlyOpenA) {
    Serial.println("\n🔓 OPENING GATE A...");
    gateServoA.write(SERVO_OPEN_ANGLE);
    gateCurrentlyOpenA = true;
    gateOpenTimeA = millis();
    systemStatusA = "OPEN";
  }
}

// ============================================================
// FUNCTION: Tutup gerbang A (servo -> CLOSED angle)
// ============================================================
void closeGateA() {
  if (gateCurrentlyOpenA) {
    Serial.println("\n🔒 CLOSING GATE A...");
    gateServoA.write(SERVO_CLOSED_ANGLE);
    gateCurrentlyOpenA = false;
    systemStatusA = "CLOSED";
  }
}

// ============================================================
// FUNCTION: Buka gerbang B (servo -> OPEN angle)
// ============================================================
void openGateB() {
  if (!gateCurrentlyOpenB) {
    Serial.println("\n🔓 OPENING GATE B...");
    gateServoB.write(SERVO_OPEN_ANGLE);
    gateCurrentlyOpenB = true;
    gateOpenTimeB = millis();
    systemStatusB = "OPEN";
  }
}

// ============================================================
// FUNCTION: Tutup gerbang B (servo -> CLOSED angle)
// ============================================================
void closeGateB() {
  if (gateCurrentlyOpenB) {
    Serial.println("\n🔒 CLOSING GATE B...");
    gateServoB.write(SERVO_CLOSED_ANGLE);
    gateCurrentlyOpenB = false;
    systemStatusB = "CLOSED";
  }
}

// ============================================================
// FUNCTION: Setup - Dipanggil sekali saat power on
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(2000); // Wait for Serial to initialize

  Serial.println("\n\n========================================");
  Serial.println("🚗 Parksense Dual Gate Control System");
  Serial.println("========================================\n");

  // Setup pins - Gate A
  pinMode(TRIGGER_PIN_A, OUTPUT);
  pinMode(ECHO_PIN_A, INPUT);

  // Setup pins - Gate B
  pinMode(TRIGGER_PIN_B, OUTPUT);
  pinMode(ECHO_PIN_B, INPUT);

  // Setup servo A
  gateServoA.attach(SERVO_PIN_A);
  gateServoA.write(SERVO_CLOSED_ANGLE); // Start closed
  Serial.println("✅ Servo A initialized (CLOSED position)");

  // Setup servo B
  gateServoB.attach(SERVO_PIN_B);
  gateServoB.write(SERVO_CLOSED_ANGLE); // Start closed
  Serial.println("✅ Servo B initialized (CLOSED position)");

  // Setup WiFi
  setupWiFi();

  // Setup MQTT
  setupMQTT();

  Serial.println("\n✅ System initialization complete!");
  Serial.println("\n📖 Type 'help' in Serial Monitor untuk lihat available commands.");
  Serial.println("🔄 Auto QR simulation aktif - trigger setiap 15 detik\n");
}

// ============================================================
// FUNCTION: Loop - Dipanggil terus-menerus
// ============================================================
void loop() {
  // Handle Serial Commands (untuk manual testing)
  handleSerialCommand();

  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    Serial.println("\n❌ MQTT disconnected, reconnecting...");
    setupMQTT();
  }
  mqttClient.loop();

  // ===== DUMMY QR SIMULATION (untuk testing tanpa Flutter app) =====
  simulateDummyQRScanA();
  simulateDummyQRScanB();

  // ===== GATE A LOGIC =====
  
  // Deteksi kendaraan di Gate A
  detectVehicleA();

  // Gate A logic:
  // 1. Jika ada perintah OPEN_GATE dari backend dan kendaraan terdeteksi
  if (gateOpenRequestedA && vehicleDetectedA) {
    openGateA();
    gateOpenRequestedA = false;
  }

  // 2. Jika gerbang A sudah terbuka dan timeout (kendaraan sudah lewat)
  if (gateCurrentlyOpenA && millis() - gateOpenTimeA > GATE_OPEN_DURATION_MS) {
    Serial.println("\n⏰ Gate A duration expired, closing gate");
    closeGateA();
  }

  // ===== GATE B LOGIC =====
  
  // Deteksi kendaraan di Gate B
  detectVehicleB();

  // Gate B logic:
  // 1. Jika ada perintah OPEN_GATE dari backend dan kendaraan terdeteksi
  if (gateOpenRequestedB && vehicleDetectedB) {
    openGateB();
    gateOpenRequestedB = false;
  }

  // 2. Jika gerbang B sudah terbuka dan timeout (kendaraan sudah lewat)
  if (gateCurrentlyOpenB && millis() - gateOpenTimeB > GATE_OPEN_DURATION_MS) {
    Serial.println("\n⏰ Gate B duration expired, closing gate");
    closeGateB();
  }

  // Publish status setiap 5 detik
  if (millis() - lastMQTTPublishA > 5000) {
    publishStatusA();
    lastMQTTPublishA = millis();
  }

  if (millis() - lastMQTTPublishB > 5000) {
    publishStatusB();
    lastMQTTPublishB = millis();
  }

  delay(100); // Small delay untuk stabilitas
}

/*
 * ============================================================
 * NOTES:
 * 
 * 1. Update SSID, PASSWORD, dan MQTT_BROKER sesuai konfigurasi
 * 2. Pin assignments dapat disesuaikan sesuai hardware
 * 3. ULTRASONIC_THRESHOLD_CM: tune sesuai jarak gerbang
 * 4. GATE_OPEN_DURATION_MS: sesuaikan lama gerbang terbuka
 * 
 * Hardware Connection:
 * 
 * GATE A:
 * - HC-SR04 Sensor A VCC → ESP32 5V
 * - HC-SR04 Sensor A GND → ESP32 GND
 * - HC-SR04 Sensor A TRIG → GPIO26
 * - HC-SR04 Sensor A ECHO → GPIO25
 * 
 * - Servo A GND → ESP32 GND
 * - Servo A 5V → ESP32 5V (dari external power supply!)
 * - Servo A SIGNAL → GPIO12
 * 
 * GATE B:
 * - HC-SR04 Sensor B VCC → ESP32 5V
 * - HC-SR04 Sensor B GND → ESP32 GND
 * - HC-SR04 Sensor B TRIG → GPIO14
 * - HC-SR04 Sensor B ECHO → GPIO27
 * 
 * - Servo B GND → ESP32 GND
 * - Servo B 5V → ESP32 5V (dari external power supply!)
 * - Servo B SIGNAL → GPIO13
 * ============================================================
 */