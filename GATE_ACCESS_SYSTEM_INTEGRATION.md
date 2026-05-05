# Parksense - Gate Access System Integration

## Sistem Overview

```
┌─────────────────────┐
│   Mobile App        │
│  (Scan + Send QR)   │
└──────────┬──────────┘
           │ POST /api/gate/scan-qr
           │ { "qrData": "{...}" }
           │
           ▼
┌─────────────────────┐
│   Backend Server    │
│  (Validate QR)      │
└──────────┬──────────┘
           │ MQTT Publish
           │ parksense/gate/gate_a/command
           │
           ▼
┌─────────────────────┐
│   ESP32 Gateway     │
│  (Control Gate)     │
│  + Ultrasonic       │
└─────────────────────┘
```

---

## 1. Mobile App Implementation

### Development Setup: Localhost Configuration

Untuk development lokal, ada beberapa skenario:

#### Skenario 1: Single Device (Laptop + Backend)
```dart
const String BACKEND_URL = 'http://localhost:3000';
```

#### Skenario 2: Multi-Device Same Machine (Emulator/Phone)
```dart
// Android Emulator
const String BACKEND_URL = 'http://10.0.2.2:3000';

// Physical Phone (via WiFi)
const String BACKEND_URL = 'http://192.168.1.5:3000';
```

#### Skenario 3: Multi-Laptop Setup (RECOMMENDED) ⭐
**Setup seperti ini (2 HP + 2 Laptop di network yang sama):**
```
Laptop Teman (Dev)         Laptop User (Backend)
    ↓                             ↓
  [Flutter App]            [Node.js Server]
    ↓ build & run               ↓ npm start
  [HP 1: Generate QR]    listening at 192.168.1.10:3000
    ↓ scan dengan HP 2
  [HP 2: Scan]
    ↓
  [Send ke Backend]
```

**Yang perlu dilakukan:**

1️⃣ **Cari IP Laptop User (Backend):**
```powershell
ipconfig
# Cari: IPv4 Address: 192.168.x.x (misalnya: 192.168.1.10)
```

2️⃣ **Update `.env` Backend Supaya Listen di Semua Network:**
```bash
# Di backend/.env
PORT=3000
# Biarkan default, Node.js akan listen di 0.0.0.0:3000
# Artinya accessible dari semua IP di network
```

3️⃣ **Backend harus running di Laptop User:**
```bash
cd parksense-backend
npm start
# Output: 🚀 Server berjalan di http://localhost:3000
# Tapi juga accessible via: http://192.168.1.10:3000
```

4️⃣ **Teman Update App dengan IP Laptop User:**
```dart
// Di laptop teman, file Flutter:
class AppConfig {
  // Ganti 192.168.1.10 dengan IP yang user kasih
  static const String BACKEND_URL = 'http://192.168.1.10:3000';
}
```

5️⃣ **Build di Laptop Teman & Run di 2 HP Teman:**
```bash
# Di laptop teman
flutter run
# Pilih device 1 & 2 (2 HP yang berbeda)
```

#### Skenario 4: Production
```dart
const String BACKEND_URL = 'https://api.parksense.com';
```

---

### Cara Cari IP Lokal Komputer Anda:

**Windows:**
```powershell
ipconfig
# Cari "IPv4 Address" yang dimulai 192.168.x.x atau 10.0.x.x
```

**Mac/Linux:**
```bash
ifconfig
# Cari inet yang dimulai 192.168 atau 10.0
```

---

### Generate QR Code dengan Format JSON

```dart
import 'dart:convert';
import 'package:qr_flutter/qr_flutter.dart';

// ✅ UPDATE INI UNTUK DEVELOPMENT LOKAL
class AppConfig {
  // Pilih salah satu sesuai setup Anda:
  // static const String BACKEND_URL = 'http://localhost:3000';           // Web/Desktop
  // static const String BACKEND_URL = 'http://10.0.2.2:3000';            // Android Emulator
  static const String BACKEND_URL = 'http://192.168.1.5:3000';          // Physical Phone (GANTI IP SESUAI KOMPUTER ANDA)
  // static const String BACKEND_URL = 'https://api.parksense.com';      // Production
}

class GateAccessScreen extends StatefulWidget {
  @override
  State<GateAccessScreen> createState() => _GateAccessScreenState();
}

class _GateAccessScreenState extends State<GateAccessScreen> {
  late String _qrData;
  final String _userId = "2021110045";
  final String _licensePlate = "B 1234 XYZ";
  final String _accessPoint = "Gate A";

  @override
  void initState() {
    super.initState();
    _generateQrData();
  }

  // Generate QR Data - dipanggil setiap kali screen dibuka
  void _generateQrData() {
    final payload = {
      'userId': _userId,
      'plate': _licensePlate,
      'gate': _accessPoint,
      'exp': DateTime.now()
          .add(const Duration(minutes: 3))
          .millisecondsSinceEpoch,
    };
    setState(() {
      _qrData = jsonEncode(payload);
    });
    print('✅ QR Generated: $_qrData');
  }

  // Scan QR - trigger saat user sudah scan QR mereka
  Future<void> _scanAndSendQR() async {
    try {
      // Show dialog while sending
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => Dialog(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Processing Gate Access...'),
              ],
            ),
          ),
        ),
      );

      // Send QR to backend
      final response = await http.post(
        Uri.parse('${AppConfig.BACKEND_URL}/api/gate/scan-qr'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'qrData': _qrData,
        }),
      );

      Navigator.pop(context); // Close dialog

      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message']),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );

        // Gate should be opening now - show notification
        print('✅ Gate Access Granted!');
        _showGateOpeningNotification(result);
      } else {
        final error = jsonDecode(response.body);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error['message'] ?? 'Access Denied'),
            backgroundColor: Colors.red,
          ),
        );

        print('❌ Gate Access Denied: ${error['reason']}');
      }
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  void _showGateOpeningNotification(Map<String, dynamic> result) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Gate Access Granted'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Status: ${result['action']}'),
            SizedBox(height: 8),
            Text('Gate: ${result['gate']}'),
            SizedBox(height: 8),
            Text('Vehicle: ${result['plate']}'),
            SizedBox(height: 16),
            Text(
              'The gate will open when vehicle is detected...',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Gate Access'),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // QR Code Display
              Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Text(
                        'Scan this QR Code at the gate',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      SizedBox(height: 16),
                      QrImage(
                        data: _qrData,
                        version: QrVersions.auto,
                        size: 250,
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                      ),
                      SizedBox(height: 16),
                      Text(
                        'Expires in 3 minutes',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(height: 24),
              
              // Vehicle Info Display
              Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Vehicle Information', style: Theme.of(context).textTheme.titleSmall),
                      SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('License Plate:'),
                          Text(_licensePlate, style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Access Point:'),
                          Text(_accessPoint, style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('User ID:'),
                          Text(_userId, style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(height: 24),

              // Send Button
              ElevatedButton(
                onPressed: _scanAndSendQR,
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Text(
                    'SCAN & REQUEST GATE ACCESS',
                    style: TextStyle(fontSize: 16),
                  ),
                ),
              ),

              SizedBox(height: 16),

              // Refresh QR Button
              OutlinedButton(
                onPressed: _generateQrData,
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Text('Generate New QR'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

---

## 2. Backend API Endpoint

### POST /api/gate/scan-qr

**Request:**
```json
{
  "qrData": "{\"userId\":\"2021110045\",\"plate\":\"B 1234 XYZ\",\"gate\":\"Gate A\",\"exp\":1777992910901}"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "QR code valid, gate command sent",
  "action": "OPENING",
  "gate": "Gate A",
  "plate": "B 1234 XYZ",
  "duration": "Until vehicle exits"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "QR code expired",
  "reason": "Invalid plate format"
}
```

**Duplicate Scan (409):**
```json
{
  "success": false,
  "message": "Duplicate scan - please wait before scanning again",
  "reason": "DUPLICATE_SCAN",
  "retryAfter": 1
}
```

---

## 3. MQTT Message Flow

### Gate Command Topic
`parksense/gate/gate_a/command`

**Payload (dikirim backend → ESP32):**
```json
{
  "action": "OPEN_GATE",
  "userId": "2021110045",
  "plate": "B 1234 XYZ",
  "allowedDurationSeconds": 10,
  "timestamp": 1715000000000
}
```

### Gate Status Topic
`parksense/gate/gate_a/status`

**Payload (dikirim ESP32 → backend, every 5 seconds):**
```json
{
  "gate": "Gate_A",
  "status": "OPEN",
  "systemStatus": "OPEN",
  "vehicleDetected": true,
  "timestamp": 1715000000000
}
```

---

## 4. ESP32 Hardware Setup

### Wiring Diagram

```
HC-SR04 Ultrasonic Sensor:
├── VCC → ESP32 5V
├── GND → ESP32 GND
├── TRIG → GPIO26
└── ECHO → GPIO25

Servo Motor:
├── GND → ESP32 GND
├── 5V → External Power Supply (important!)
└── SIGNAL → GPIO12

LED Indicator (optional):
├── (+) → GPIO13 (via 220Ω resistor)
└── (-) → GND
```

### Configuration Dalam Firmware
```cpp
#define TRIGGER_PIN 26           // Ultrasonic trigger
#define ECHO_PIN 25              // Ultrasonic echo
#define SERVO_PIN 12             // Servo control
#define LED_PIN 13               // LED indicator

#define SERVO_CLOSED_ANGLE 0     // Gate closed position
#define SERVO_OPEN_ANGLE 90      // Gate open position
#define GATE_OPEN_DURATION_MS 10000  // Auto close after 10 seconds

#define ULTRASONIC_THRESHOLD_CM 100  // Detect vehicle within 100cm
```

---

## 5. System Logic Flow

```
┌─────────────────┐
│  Mobile App     │
└────────┬────────┘
         │ Generate QR + POST /api/gate/scan-qr
         ▼
┌─────────────────────────────┐
│  Backend Validation         │
│  - Parse JSON               │
│  - Check expiry             │
│  - Validate plate format    │
│  - Check for duplicates     │
└────────┬────────────────────┘
         │ ✅ Valid
         │ Publish to MQTT
         │ parksense/gate/gate_a/command
         ▼
┌──────────────────────────────┐
│  ESP32 Receives Command      │
│  Sets: gateOpenRequested=true│
│  Status: AWAITING_VEHICLE    │
└────────┬─────────────────────┘
         │
         │ Continuously read ultrasonic
         │
         ├─► NO vehicle → Wait
         │
         ▼
         YES vehicle detected
         ├─► gateOpenRequested=true
         │   → Open Servo
         │   → Wait 10 seconds
         │   → Check if vehicle still there
         │
         ├─► Still there → Keep open
         │
         └─► No longer there → Close servo
```

---

## 6. Error Scenarios & Handling

### Scenario 1: Expired QR Code
- User scans QR yang sudah lebih dari 3 menit
- **Response:** `"QR code expired"`
- **Solution:** Generate QR baru

### Scenario 2: Duplicate Scan (Too Fast)
- User scan 2x dalam 2 detik
- **Response:** `"Duplicate scan - please wait 1 second"`
- **Solution:** Wait dan retry

### Scenario 3: Invalid Plate Format
- Plate tidak sesuai format Indonesia (B 1234 XYZ)
- **Response:** `"Invalid plate format"`
- **Solution:** Update license plate di app

### Scenario 4: No Vehicle Detected
- QR valid, backend kirim command, tapi ESP32 tidak deteksi kendaraan
- **Result:** Servo tidak akan terbuka sampai kendaraan terdeteksi
- **Solution:** Posisikan kendaraan dalam range sensor (< 100cm)

### Scenario 5: WiFi/MQTT Lost on ESP32
- ESP32 kehilangan koneksi internet
- **Result:** Tidak bisa menerima command, gate tetap tertutup
- **Solution:** Check WiFi connection, restart ESP32

---

## 7. Testing Checklist

- [ ] QR generates with correct format
- [ ] QR expires after 3 minutes
- [ ] Backend validates JSON properly
- [ ] Duplicate scan detection works
- [ ] MQTT publishes command successfully
- [ ] ESP32 receives MQTT command
- [ ] Ultrasonic sensor detects vehicle
- [ ] Servo opens/closes at correct angles
- [ ] Gate auto-closes after 10 seconds
- [ ] LED indicator turns on/off correctly
- [ ] Timeout handling works
- [ ] System recovers after WiFi reconnect

---

## 8. Dependencies

### Mobile App (Flutter)
```yaml
dependencies:
  qr_flutter: ^4.0.0
  http: ^1.0.0
```

### Backend (Node.js)
```json
{
  "mqtt": "^5.0.0",
  "socket.io": "^4.5.0",
  "express": "^4.18.0"
}
```

### ESP32 (Arduino IDE)
- WiFi.h (built-in)
- PubSubClient (install via Library Manager)
- ArduinoJson (install via Library Manager)
- Servo.h (built-in)

---

## 9. Multi-Laptop Cross-Device Setup Guide

### Network Diagram

```
┌──────────────────────┐          ┌──────────────────────┐
│  Laptop Teman        │          │  Laptop User         │
│  (Flutter Dev)       │          │  (Backend Server)    │
│                      │          │                      │
│  OS: Windows/Mac     │          │  OS: Windows/Mac     │
│  IP: 192.168.1.20    │          │  IP: 192.168.1.10    │
└──────────┬───────────┘          └──────────┬───────────┘
           │                               │
           │ WiFi Network (SAME SSID)      │
           │                               │
      ┌────▼──────────┐         ┌──────────▼────┐
      │  HP 1 Teman   │         │  Backend      │
      │  Generate QR  │         │  :3000        │
      │  192.168.1.101│         └───────────────┘
      └───────────────┘
      
      ┌───────────────┐
      │  HP 2 Teman   │
      │  Scan QR      │
      │  192.168.1.102│
      └─────┬─────────┘
            │
            └──→ POST /api/gate/scan-qr
                 ke 192.168.1.10:3000
```

### Step-by-Step Setup

**Step 1: Pastikan Semua Device WiFi ke Network yang Sama**
```
Checklist:
- ✅ Laptop User: terhubung WiFi (misal: "HomeWiFi")
- ✅ Laptop Teman: terhubung WiFi yang SAMA
- ✅ HP 1 Teman: terhubung WiFi yang SAMA
- ✅ HP 2 Teman: terhubung WiFi yang SAMA

Jika Network berbeda → Tidak bisa komunikasi!
```

**Step 2: User Cari IP Laptop User**
```powershell
# Di Laptop User, buka PowerShell:
ipconfig

# Output:
# ...
# Ethernet adapter atau WiFi:
#   IPv4 Address. . . . . . . . . . . : 192.168.1.10
#   Subnet Mask . . . . . . . . . . . : 255.255.255.0
# ...

# CATAT IP: 192.168.1.10
```

**Step 3: User Setup Backend Listening ke Semua Network**

File: `parksense-backend/.env`
```bash
# Pastikan port configuration:
PORT=3000

# Catatan: Node.js default listen ke 0.0.0.0
# Artinya accessible dari semua IP di network
```

**Step 4: User Jalankan Backend**
```bash
cd parksense-backend
npm start

# Output akan terlihat:
# 🚀 Server berjalan di http://localhost:3000
# 
# Tapi juga accessible dari:
# - http://192.168.1.10:3000 (dari network)
# - http://10.0.2.2:3000 (dari Android emulator)
```

**Step 5: User Kasih IP ke Teman**
```
User kirim ke Teman:
"IP backend saya: 192.168.1.10:3000"
```

**Step 6: Teman Update Flutter Code**

File: `lib/config/app_config.dart` (atau di screen tempat generate QR)
```dart
class AppConfig {
  // ✅ UPDATE dengan IP yang user kasih
  static const String BACKEND_URL = 'http://192.168.1.10:3000';
}
```

**Step 7: Teman Build di Laptop, Deploy ke 2 HP**
```bash
# Di laptop teman:
flutter run

# Output akan bertanya device mana yang target:
# Multiple devices found:
# 1 - 86Y5P01W7Q      (Android)
# 2 - EMULATOR-5554   (Android emulator)
# 
# Ketik: 1 (untuk HP 1)
# Ketik: 2 (untuk HP 2)
# Atau build 2x untuk 2 device
```

**Step 8: Test dari HP 1**
```
Di HP 1 (Generate QR):
1. Buka app
2. Lihat QR code
3. Catat: userId, plate, gate, exp
4. Tap "SCAN & REQUEST GATE ACCESS"
```

**Step 9: Lihat Response di Laptop User**
```bash
# Di backend logs, akan terlihat:

📱 QR Scan Request Received:
   Raw Data: {"userId":"2021110045",...}

✅ QR Validation Success:
   User ID: 2021110045
   Plate: B 1234 XYZ
   Gate: Gate A
   Expires: ...

🔌 MQTT Connected. Publishing to: parksense/gate/gate_a/command
📡 MQTT Command Published: {"action":"OPEN_GATE",...}

✅ [Socket.io] Broadcast → gate_event: qr_scan_result
```

### Troubleshooting Multi-Laptop Setup

**Problem: "Connection refused" dari HP 1**
```
Solusi:
1. Cek HP 1 WiFi ke network yang sama
   → Settings → WiFi → pilih SSID yang sama dengan laptop

2. Ping laptop user dari HP 1:
   $ ping 192.168.1.10
   Jika reply → network OK
   Jika timeout → device tidak satu network

3. Test di browser HP 1:
   http://192.168.1.10:3000/api/health
   
   Jika ada response → backend OK
   Jika timeout → backend mungkin tidak running
```

**Problem: Teman Update URL tapi HP masih pakai URL lama**
```
Solusi:
1. Clean build di laptop teman:
   $ flutter clean
   $ flutter pub get
   
2. Rebuild dan deploy ke HP:
   $ flutter run
   
3. Jika masih tidak berubah, uninstall app di HP dan install ulang
```

**Problem: Backend Running tapi dari HP tidak bisa akses**
```
Solusi:
1. Cek apakah server listening di semua interface:
   $ netstat -an | find ":3000"
   Output harus terlihat: 0.0.0.0:3000 (LISTENING)
   
2. Jika hanya localhost:3000, restart backend
   
3. Cek Windows Firewall:
   Settings → Firewall → Allow app through firewall
   → Pastikan Node.js ter-allow
```

**Problem: MQTT Publish dari backend tapi ESP32 tidak terima**
```
Solusi:
1. ESP32 firmware sudah update MQTT_BROKER?
   → const char* MQTT_BROKER = "broker.hivemq.com";
   
2. Cek ESP32 console:
   ✅ MQTT Connected? atau ❌ MQTT Connection failed?
   
3. Test MQTT manually:
   Gunakan tool: MQTT Explorer (https://mqtt-explorer.com)
   → Connect ke broker.hivemq.com
   → Subscribe ke parksense/gate/gate_a/command
   → Trigger QR scan dari HP 1
   → Lihat apakah message masuk
```

### Performance Notes

- **Latency:** ~200-500ms dari HP → Backend → MQTT → ESP32 (tergantung WiFi)
- **Duplicate Prevention:** 2 detik cache untuk cegah spam
- **QR Expiry:** 3 menit (configurable di gateController.js)
- **Gate Auto-Close:** 10 detik (configurable di ESP32 firmware)

---

## 10. Development Troubleshooting

### Network Connection Issues

**Problem: "Connection refused" atau "ERR_CONNECTION_REFUSED"**
```
Solusi:
1. Pastikan backend sudah running:
   $ npm start
   
2. Cek IP address yang benar:
   Windows: ipconfig
   Mac/Linux: ifconfig
   
3. Pastikan phone & komputer di network yang sama (WiFi)

4. Test koneksi dari command line:
   curl http://192.168.1.5:3000/api/health
   
   Jika berhasil, response akan:
   {
     "message": "🚗 Parksense Backend API berjalan!",
     "status": "OK"
   }
```

**Problem: "timeout" saat scan QR**
```
Solusi:
1. Backend mungkin down atau tak tersedia
2. Cek backend console untuk error
3. Pastikan MQTT broker juga running (HiveMQ)
4. Tunggu 2-3 detik dan retry (app punya duplicate prevention)
```

**Problem: "socket hang up" atau disconnected**
```
Solusi:
1. Backend perlu restart:
   $ npm start
   
2. Cek apakah ada error di backend logs
3. Restart MQTT connection:
   $ node simulator.js
```

### Android Emulator Specific

**Jika pakai Android Emulator:**
```
1. JANGAN gunakan localhost:3000
2. HARUS gunakan 10.0.2.2:3000
   (10.0.2.2 adalah alias khusus untuk host machine di emulator)

3. Pastikan emulator bisa akses komputer:
   $ telnet 10.0.2.2 3000
   
   Jika muncul "Connected", maka terhubung ✅
```

### Physical Phone Testing (Recommended)

**Setup:**
```
1. Cari IP lokal komputer:
   ipconfig (Windows) → cari IPv4 Address: 192.168.x.x
   
2. Update code Flutter:
   const String BACKEND_URL = 'http://192.168.1.5:3000';
   
3. Build & run di phone:
   flutter run
   
4. Phone harus WiFi ke network yang sama dengan komputer
```

**Test Network Connection:**
```
Dari phone, buka browser:
http://192.168.1.5:3000/api/health

Jika success, akan muncul:
{
  "message": "🚗 Parksense Backend API berjalan!",
  "status": "OK"
}
```

### Hot Reload Development

**Saat development, untuk fast iteration:**
```dart
// Tambahkan ini di pubspec.yaml:
dev_dependencies:
  flutter_test:
    sdk: flutter
  mocktail: ^0.3.0

// Gunakan flutter run dengan hot reload:
$ flutter run

// Edit code → Save (Ctrl+S) → Hot Reload (R)
```

### Testing dengan 2 HP (Recommended Workflow)

**Workflow untuk test QR Generate + Scan:**
```
Iteration 1:
┌─ HP 1: Generate QR + show
├─ HP 2: Scan from HP 1
├─ Backend: Validate + check logs
├─ (Lihat output di backend terminal)
└─ Teman edit code di laptopnya → flutter run hot-reload

Iteration 2:
┌─ HP 1: Generate QR baru
├─ HP 2: Scan lagi
├─ Backend: Lihat log detailnya
└─ Loop sampai sempurna
```

**Command untuk monitoring:**
```bash
# Terminal 1 (User - Backend)
cd parksense-backend && npm start
# Monitor QR validation & MQTT publish

# Terminal 2 (User - Optional)
node simulator.js
# Simulasi dummy data

# Terminal 3 (Teman)
cd app_parking_flutter && flutter run
# Build & deploy ke 2 HP
```

---

## 10. Deployment Notes

1. **Production Security:**
   - Implement MQTT authentication (username/password)
   - Use TLS/SSL for MQTT (port 8883)
   - Add request signing to QR API
   - Implement rate limiting

2. **Configuration:**
   - Update ESP32 WiFi SSID/password
   - Configure MQTT broker address
   - Adjust ultrasonic threshold per gate location
   - Set appropriate servo angles per gate mechanism

3. **Monitoring:**
   - Log all gate access attempts
   - Monitor ESP32 connectivity status
   - Alert on repeated failed access attempts
   - Track gate open/close duration

