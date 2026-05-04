// ============================================================
// PARKSENSE — Firmware ESP32
// Fungsi: Baca sensor HC-SR04, kirim status ke MQTT Broker
//         Kontrol servo portal dan LED indikator
// ============================================================

// Library WiFi bawaan ESP32
#include <WiFi.h>
// Library untuk koneksi MQTT
#include <PubSubClient.h>
// Library untuk membuat format JSON
#include <ArduinoJson.h>
// Library untuk kontrol servo
#include <ESP32Servo.h>

// ============================================================
// KONFIGURASI — SESUAIKAN BAGIAN INI
// ============================================================

// --- WiFi ---
const char* WIFI_SSID     = "AndroidAP_8539";   // Ganti dengan nama WiFi
const char* WIFI_PASSWORD = "reooooooo";     // Ganti dengan password WiFi

// --- MQTT Broker ---
// Harus SAMA dengan yang ada di .env backend!
const char* MQTT_BROKER   = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;
const char* MQTT_TOPIC    = "parksense/itb/slot/status";

// ID unik untuk ESP32 ini — HARUS unik jika punya lebih dari 1 ESP32
// Format: esp32-parksense-SLOTID
const char* CLIENT_ID     = "esp32-parksense-A01";

// --- Identitas Slot ---
// Ganti sesuai slot parkir yang dipasangi sensor ini
const char* SLOT_ID       = "A-01";
const char* SLOT_ZONE     = "Labtek V";

// ============================================================
// KONFIGURASI PIN
// ============================================================

// Sensor HC-SR04
const int PIN_TRIG        = 14;  // GPIO14 → TRIG sensor
const int PIN_ECHO        = 12;  // GPIO12 → ECHO sensor

// Servo Motor (portal gerbang)
const int PIN_SERVO       = 13;  // GPIO13 → Signal servo

// LED Indikator
const int PIN_LED_HIJAU   = 26;  // GPIO26 → LED Hijau (kosong)
const int PIN_LED_MERAH   = 27;  // GPIO27 → LED Merah (terisi)

// ============================================================
// KONFIGURASI LOGIKA SENSOR
// ============================================================

// Jika jarak objek di bawah nilai ini → slot TERISI (ada kendaraan)
const int JARAK_THRESHOLD_CM  = 50;

// Durasi objek harus terdeteksi sebelum status dikunci (anti false positive)
// 3000 ms = 3 detik, sama dengan spesifikasi sistem
const int DELAY_VALIDATION_MS = 3000;

// Interval heartbeat ke broker (60 detik)
const int HEARTBEAT_INTERVAL  = 60000;

// ============================================================
// VARIABEL GLOBAL
// ============================================================

WiFiClient   espClient;
PubSubClient mqttClient(espClient);
Servo        servoMotor;

// Menyimpan status slot saat ini (0=kosong, 1=terisi)
int statusSlotSaatIni  = -1; // -1 = belum ada status (baru nyala)

// Waktu pertama kali objek terdeteksi (untuk delay validation)
unsigned long waktuDeteksiAwal = 0;
bool sedangValidasi            = false;

// Waktu heartbeat terakhir
unsigned long waktuHeartbeatTerakhir = 0;

// ============================================================
// FUNGSI: Koneksi ke WiFi
// ============================================================
void connectWiFi() {
  Serial.print("📶 Menghubungkan ke WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Tunggu sampai terhubung
  int percobaan = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    percobaan++;

    // Jika 30 detik belum terhubung, restart ESP32
    if (percobaan > 60) {
      Serial.println("\n❌ WiFi gagal! Restart...");
      ESP.restart();
    }
  }

  Serial.println("\n✅ WiFi terhubung!");
  Serial.print("📍 IP Address: ");
  Serial.println(WiFi.localIP());
}

// ============================================================
// FUNGSI: Koneksi ke MQTT Broker
// ============================================================
void connectMQTT() {
  // Coba terus sampai berhasil
  while (!mqttClient.connected()) {
    Serial.print("🔌 Menghubungkan ke MQTT Broker...");

    if (mqttClient.connect(CLIENT_ID)) {
      Serial.println(" ✅ Terhubung!");
    } else {
      Serial.print(" ❌ Gagal, kode error: ");
      Serial.println(mqttClient.state());
      Serial.println("   Coba lagi dalam 3 detik...");
      delay(3000);
    }
  }
}

// ============================================================
// FUNGSI: Ukur jarak menggunakan HC-SR04
// Return: jarak dalam cm
// ============================================================
float ukurJarak() {
  // Kirim sinyal trigger selama 10 microsecond
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  // Baca durasi sinyal echo
  // Timeout 30ms (jika tidak ada pantulan dalam 30ms, anggap tidak ada objek)
  long durasi = pulseIn(PIN_ECHO, HIGH, 30000);

  // Konversi durasi ke jarak (cm)
  // Rumus: jarak = (durasi * kecepatan_suara) / 2
  // kecepatan suara = 34cm/ms, jadi 0.034cm/µs
  float jarak = (durasi * 0.034) / 2;

  // Jika jarak 0 atau sangat besar = tidak ada objek terdeteksi
  if (durasi == 0 || jarak <= 0 || jarak > 400) {
    return 999; // Return 999 sebagai tanda "tidak ada objek"
  }

  return jarak;
}

// ============================================================
// FUNGSI: Set LED berdasarkan status slot
// ============================================================
void setLED(int status) {
  if (status == 1) {
    // Slot TERISI → LED Merah nyala, LED Hijau mati
    digitalWrite(PIN_LED_MERAH, HIGH);
    digitalWrite(PIN_LED_HIJAU, LOW);
  } else {
    // Slot KOSONG → LED Hijau nyala, LED Merah mati
    digitalWrite(PIN_LED_HIJAU, HIGH);
    digitalWrite(PIN_LED_MERAH, LOW);
  }
}

// ============================================================
// FUNGSI: Gerakkan servo portal
// ============================================================
void gerakServo(bool buka) {
  if (buka) {
    // Buka portal → putar 90 derajat
    servoMotor.write(90);
    Serial.println("🔓 Portal TERBUKA");
  } else {
    // Tutup portal → kembali ke 0 derajat
    servoMotor.write(0);
    Serial.println("🔒 Portal TERTUTUP");
  }
}

// ============================================================
// FUNGSI: Kirim status slot ke MQTT Broker
// ============================================================
void kirimStatusMQTT(int status, float jarak) {
  // Pastikan koneksi MQTT masih aktif
  if (!mqttClient.connected()) {
    connectMQTT();
  }

  // Buat dokumen JSON
  // Format sama persis dengan yang dikirim simulator!
  StaticJsonDocument<256> doc;
  doc["slot_id"]          = SLOT_ID;
  doc["zone"]             = SLOT_ZONE;
  doc["status"]           = status;
  doc["distance_cm"]      = (int)jarak;
  doc["device_timestamp"] = millis(); // waktu sejak ESP32 nyala (ms)
  doc["source"]           = "hardware"; // tanda bahwa ini dari hardware asli

  // Konversi JSON ke string
  char pesanJSON[256];
  serializeJson(doc, pesanJSON);

  // Publish ke broker
  bool berhasil = mqttClient.publish(MQTT_TOPIC, pesanJSON, true);

  if (berhasil) {
    Serial.print("📤 MQTT Publish ✅ | Slot: ");
    Serial.print(SLOT_ID);
    Serial.print(" | Status: ");
    Serial.print(status == 1 ? "🔴 TERISI" : "🟢 KOSONG");
    Serial.print(" | Jarak: ");
    Serial.print((int)jarak);
    Serial.println(" cm");
  } else {
    Serial.println("❌ MQTT Publish GAGAL! State: " + String(mqttClient.state()));
  }
}

// ============================================================
// FUNGSI: Kirim heartbeat (tanda ESP32 masih hidup)
// ============================================================
void kirimHeartbeat() {
  StaticJsonDocument<128> doc;
  doc["slot_id"]  = SLOT_ID;
  doc["zone"]     = SLOT_ZONE;
  doc["type"]     = "heartbeat";
  doc["uptime_ms"] = millis();
  doc["source"]   = "hardware";

  char pesanJSON[128];
  serializeJson(doc, pesanJSON);

  // Kirim ke topik khusus heartbeat (opsional, untuk monitoring kesehatan)
  String topikHeartbeat = String(MQTT_TOPIC) + "/heartbeat";
  mqttClient.publish(topikHeartbeat.c_str(), pesanJSON);

  Serial.println("💓 Heartbeat terkirim");
}

// ============================================================
// SETUP — Berjalan sekali saat ESP32 pertama nyala
// ============================================================
void setup() {
  // Inisialisasi Serial Monitor (untuk debugging)
  Serial.begin(115200);
  delay(1000);

  Serial.println("=================================");
  Serial.println("  🚗 PARKSENSE — ESP32 Firmware");
  Serial.println("=================================");
  Serial.print("Slot ID  : "); Serial.println(SLOT_ID);
  Serial.print("Zona     : "); Serial.println(SLOT_ZONE);
  Serial.println("=================================");

  // Setup pin sensor
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);

  // Setup pin LED
  pinMode(PIN_LED_HIJAU, OUTPUT);
  pinMode(PIN_LED_MERAH, OUTPUT);

  // Nyalakan kedua LED sebentar sebagai tanda ESP32 menyala
  digitalWrite(PIN_LED_HIJAU, HIGH);
  digitalWrite(PIN_LED_MERAH, HIGH);
  delay(500);
  digitalWrite(PIN_LED_HIJAU, LOW);
  digitalWrite(PIN_LED_MERAH, LOW);

  // Setup servo
  servoMotor.attach(PIN_SERVO);
  servoMotor.write(0); // Posisi awal: tertutup (0°)
  delay(500); // Tunggu servo settle

  // Hubungkan ke WiFi
  connectWiFi();

  // Setup MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setKeepAlive(60);

  // Hubungkan ke MQTT
  connectMQTT();

  Serial.println("\n✅ Sistem siap! Mulai monitoring...\n");
}

// ============================================================
// LOOP — Berjalan terus menerus
// ============================================================
void loop() {
  // Pastikan koneksi MQTT tetap aktif
  if (!mqttClient.connected()) {
    Serial.println("⚠️ MQTT terputus, reconnect...");
    connectMQTT();
  }
  mqttClient.loop(); // Proses pesan MQTT yang masuk

  // --- Baca jarak dari sensor ---
  float jarak = ukurJarak();

  // --- Logika Delay Validation (Anti False Positive) ---
  // Tujuan: status baru berubah jika objek diam selama DELAY_VALIDATION_MS
  bool adaObjek = (jarak < JARAK_THRESHOLD_CM);

  if (adaObjek) {
    if (!sedangValidasi) {
      // Objek baru terdeteksi → mulai timer validasi
      waktuDeteksiAwal = millis();
      sedangValidasi   = true;
      Serial.print("👀 Objek terdeteksi di jarak ");
      Serial.print((int)jarak);
      Serial.println(" cm — memulai validasi...");
    } else {
      // Objek masih ada → cek apakah sudah melewati waktu validasi
      unsigned long selisihWaktu = millis() - waktuDeteksiAwal;

      if (selisihWaktu >= DELAY_VALIDATION_MS) {
        // ✅ Validasi selesai → slot TERISI
        if (statusSlotSaatIni != 1) {
          statusSlotSaatIni = 1;
          setLED(1);
          kirimStatusMQTT(1, jarak);
          Serial.println("🔒 Status TERKUNCI: TERISI");
        }
        sedangValidasi = false; // Reset flag validasi
      } else {
        // Masih dalam periode validasi, tampilkan countdown
        Serial.print("⏳ Validasi: ");
        Serial.print(selisihWaktu / 1000);
        Serial.print("/");
        Serial.print(DELAY_VALIDATION_MS / 1000);
        Serial.println(" detik");
      }
    }
  } else {
    // Tidak ada objek → reset validasi
    if (sedangValidasi) {
      Serial.println("↩️  Objek menghilang, validasi dibatalkan");
      sedangValidasi = false;
    }

    // Jika sebelumnya terisi, ubah jadi kosong
    if (statusSlotSaatIni != 0) {
      statusSlotSaatIni = 0;
      setLED(0);
      kirimStatusMQTT(0, jarak);
      Serial.println("✅ Status: KOSONG");
    }
  }

  // --- Kirim Heartbeat setiap 60 detik ---
  unsigned long sekarang = millis();
  if (sekarang - waktuHeartbeatTerakhir >= HEARTBEAT_INTERVAL) {
    kirimHeartbeat();
    waktuHeartbeatTerakhir = sekarang;
  }
  
  // Delay 500ms sebelum baca sensor lagi
  delay(500);
}