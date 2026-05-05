# ESP32 Dual Gate Control System - Pin Configuration

## 📋 Overview

ESP32 firmware untuk mengontrol **2 gerbang** dengan **2 sensor ultrasonik** secara independen.
- **Tidak ada LED** (dihapus)
- **2 Servo Motor** (Gate A & Gate B)
- **2 Sensor Ultrasonik** (Sensor A & Sensor B)

---

## 🔌 Pin Assignment

### Gate A
| Component | Pin | Type | Catatan |
|-----------|-----|------|---------|
| Sensor A - Trigger | GPIO26 | Output | HC-SR04 TRIG |
| Sensor A - Echo | GPIO25 | Input | HC-SR04 ECHO |
| Servo A - Signal | GPIO12 | PWM Output | Servo control |

### Gate B
| Component | Pin | Type | Catatan |
|-----------|-----|------|---------|
| Sensor B - Trigger | GPIO14 | Output | HC-SR04 TRIG |
| Sensor B - Echo | GPIO27 | Input | HC-SR04 ECHO |
| Servo B - Signal | GPIO13 | PWM Output | Servo control |

### Common (Shared)
| Component | Pin | Catatan |
|-----------|-----|---------|
| Power | 5V | Untuk sensor + servo |
| Ground | GND | Common ground |

---

## 🔧 Wiring Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         ESP32 DevKit                        │
└─────────────────────────────────────────────────────────────┘

GATE A (Left Side):
  HC-SR04 Sensor A
  ├─ VCC (5V)    → ESP32 5V
  ├─ GND         → ESP32 GND
  ├─ TRIG        → GPIO26
  └─ ECHO        → GPIO25

  Servo A
  ├─ GND         → ESP32 GND
  ├─ 5V          → External 5V Power ⚠️
  └─ SIGNAL      → GPIO12

GATE B (Right Side):
  HC-SR04 Sensor B
  ├─ VCC (5V)    → ESP32 5V
  ├─ GND         → ESP32 GND
  ├─ TRIG        → GPIO14
  └─ ECHO        → GPIO27

  Servo B
  ├─ GND         → ESP32 GND
  ├─ 5V          → External 5V Power ⚠️
  └─ SIGNAL      → GPIO13
```

---

## ⚡ Electrical Connections

### HC-SR04 Sensor Connections (Both Gates)

```
HC-SR04:
  VCC     → 5V Power Supply
  GND     → Ground
  TRIG    → GPIO Pin (set as OUTPUT)
  ECHO    → GPIO Pin (set as INPUT)
```

**Catatan:** 
- HC-SR04 beroperasi pada 5V
- Output ECHO bisa toleran dengan ESP32 GPIO (max 3.3V dengan voltage divider optional)

### Servo Motor Connections (Both Gates)

```
Servo (SG90/Similar):
  GND    → Ground
  5V     → 5V Power Supply (⚠️ GUNAKAN EXTERNAL POWER SUPPLY!)
  SIGNAL → GPIO Pin (PWM capable)
```

**⚠️ PENTING:** 
- Servo memerlukan arus yang besar (~500mA peak)
- **JANGAN** ambil dari ESP32 5V pin langsung
- Gunakan external 5V power supply dengan common ground ke ESP32

### Rekomendasi Power Supply

```
┌──────────────────┐
│  External 5V PSU │
│ (Minimal 2A)     │
└────┬─────┬───────┘
     │     │
    (+)   (-)
     │     │
     ├─────┤ (Common Ground!)
     │     │
   Servo  Servo (ESP32 GND juga connect ke (-))
   (x2)
     │
   HC-SR04 (ambil 5V dari sini juga)
   (x2)
```

---

## 🔐 MQTT Topics Configuration

Firmware ini subscribe ke 2 topics terpisah:

```
Gate A Command Topic:    parksense/gate/gate_a/command
Gate A Status Topic:     parksense/gate/gate_a/status

Gate B Command Topic:    parksense/gate/gate_b/command
Gate B Status Topic:     parksense/gate/gate_b/status
```

### Payload Format

**Command (Backend → ESP32):**
```json
{
  "action": "OPEN_GATE",
  "userId": "2021110045",
  "plate": "B 1234 XYZ",
  "allowedDurationSeconds": 10,
  "timestamp": 1683604800000
}
```

**Status (ESP32 → Backend):**
```json
{
  "gate": "Gate_A",
  "status": "OPEN",
  "systemStatus": "VEHICLE_DETECTED",
  "vehicleDetected": true,
  "timestamp": 12345678
}
```

---

## 📊 Logic Flow (Dual Gate)

```
┌─────────────────────────┐
│  Start Loop (100ms)     │
└────────────┬────────────┘
             ↓
    ┌────────────────────┐
    │ Maintain MQTT      │
    └────────┬───────────┘
             ↓
    ┌────────────────────────────────┐
    │ Detect Vehicle (Gate A)        │
    │ - Read Sensor A (GPIO26/25)    │
    │ - Update vehicleDetectedA      │
    └────────┬───────────────────────┘
             ↓
    ┌────────────────────────────────┐
    │ Gate A Logic                   │
    │ IF request + vehicle detected  │
    │   → Open Servo A (GPIO12)      │
    │ IF open > 10sec                │
    │   → Close Servo A              │
    └────────┬───────────────────────┘
             ↓
    ┌────────────────────────────────┐
    │ Detect Vehicle (Gate B)        │
    │ - Read Sensor B (GPIO14/27)    │
    │ - Update vehicleDetectedB      │
    └────────┬───────────────────────┘
             ↓
    ┌────────────────────────────────┐
    │ Gate B Logic                   │
    │ IF request + vehicle detected  │
    │   → Open Servo B (GPIO13)      │
    │ IF open > 10sec                │
    │   → Close Servo B              │
    └────────┬───────────────────────┘
             ↓
    ┌────────────────────┐
    │ Publish Status     │
    │ (every 5 sec)      │
    └────────┬───────────┘
             ↓
    ┌────────────────────┐
    │ Delay 100ms        │
    └────────┬───────────┘
             ↓
      [Loop Back]
```

---

## 🛠️ Configuration Parameters

Dapat diubah di firmware:

```cpp
// Hardware
#define TRIGGER_PIN_A 26
#define ECHO_PIN_A 25
#define SERVO_PIN_A 12

#define TRIGGER_PIN_B 14
#define ECHO_PIN_B 27
#define SERVO_PIN_B 13

// Sensor
#define ULTRASONIC_THRESHOLD_CM 100    // Jarak deteksi kendaraan
#define CONSECUTIVE_DETECTIONS 3       // Berapa kali harus terdeteksi

// Servo
#define SERVO_CLOSED_ANGLE 0            // Angle tutup (derajat)
#define SERVO_OPEN_ANGLE 90             // Angle buka (derajat)
#define GATE_OPEN_DURATION_MS 10000     // Lama gerbang terbuka (ms)

// MQTT
const char* MQTT_BROKER = "broker.hivemq.com";
const int MQTT_PORT = 1883;
```

---

## 🧪 Testing Checklist

- [ ] Sensor A HC-SR04 terdeteksi & baca jarak (~analog)
- [ ] Sensor B HC-SR04 terdeteksi & baca jarak (~analog)
- [ ] Servo A respond to `gateServoA.write()` command
- [ ] Servo B respond to `gateServoB.write()` command
- [ ] MQTT connect ke broker HiveMQ
- [ ] MQTT subscribe ke parksense/gate/gate_a/command
- [ ] MQTT subscribe ke parksense/gate/gate_b/command
- [ ] Backend publish command → ESP32 terima & execute
- [ ] Both gates dapat buka/tutup independently
- [ ] Status published ke MQTT setiap 5 detik

---

## 🐛 Troubleshooting

### Sensor tidak terdeteksi / selalu baca jarak jauh
```
Solusi:
1. Cek kabel TRIG & ECHO connection
2. Cek GPIO pin definition di code
3. Serial.print() distance value untuk debug
4. Adjust ULTRASONIC_THRESHOLD_CM
```

### Servo tidak bergerak
```
Solusi:
1. Cek power supply (5V, minimal 500mA)
2. Cek GPIO pin definition (PWM capable)
3. Test dengan simple sweep code terlebih dahulu
4. Cek servo mechanical movement (smooth?)
```

### MQTT tidak connect
```
Solusi:
1. Cek WiFi SSID & Password di firmware
2. Cek internet connection
3. Test dengan MQTT.fx atau MQTT Explorer
4. Check broker.hivemq.com accessibility
```

### Backend kirim command tapi ESP32 tidak terima
```
Solusi:
1. Check topic name (case sensitive!)
2. Check MQTT payload format (valid JSON?)
3. Use MQTT Explorer untuk monitor messages
4. Check ESP32 serial logs untuk error parsing
```

---

## 📝 Notes

- Firmware fully independent untuk setiap gate
- Bisa handle open request untuk Gate A & Gate B secara bersamaan
- Vehicle detection timeout: 5 detik
- Gate auto-close: 10 detik (configurable)
- MQTT status publish interval: 5 detik

---

## 🚀 Next Steps

1. **Hardware Assembly:** Wire sesuai diagram
2. **Firmware Upload:** Upload ke ESP32 via Arduino IDE
3. **Serial Monitor:** Check logs untuk verify status
4. **Backend Test:** Trigger QR scan untuk test MQTT flow
5. **Integration Test:** End-to-end dengan mobile app
