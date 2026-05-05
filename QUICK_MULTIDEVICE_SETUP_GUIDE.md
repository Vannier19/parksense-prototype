# Quick Setup Guide - Multi-Laptop Cross-Device Testing

## 🎯 Goal
```
HP 1 (Teman)     → Generate QR
     ↓
HP 2 (Teman)     → Scan QR
     ↓
Laptop User      → Backend Server (receive & validate)
```

---

## ⚡ Super Quick Setup (5 menit)

### Phase 1: User Setup Backend (2 menit)
```bash
# Di laptop user
cd parksense-backend
npm start

# Output akan terlihat:
# 🚀 Server berjalan di http://localhost:3000

# CATAT IP User dengan: ipconfig
# Contoh: IPv4 Address: 192.168.1.10
```

### Phase 2: User Share IP ke Teman (30 detik)
```
User: "Backend saya di: 192.168.1.10:3000"
Teman: "OK, nanti saya update di code"
```

### Phase 3: Teman Update Code & Build (2 menit)
```dart
// File: lib/config/app_config.dart
class AppConfig {
  static const String BACKEND_URL = 'http://192.168.1.10:3000';
  // Ganti 192.168.1.10 dengan IP yang user kasih
}

// Build untuk HP 1 & 2:
// $ flutter clean
// $ flutter pub get
// $ flutter run
```

### Phase 4: Test
```
1. HP 1 (Teman): Tap "Generate QR"
2. HP 1 (Teman): Tap "SCAN & REQUEST GATE ACCESS"
3. Laptop User (Backend): Lihat log
   ✅ Jika ada "QR Validation Success" → BERHASIL!
   ❌ Jika ada error → lihat section Troubleshooting
```

---

## 🔍 Checklist Pre-Testing

- [ ] Semua device (2 laptop + 2 HP) WiFi ke network **yang sama**
- [ ] Laptop User: Backend sudah running (`npm start`)
- [ ] Teman: Flutter code sudah update dengan IP yang benar
- [ ] Teman: Sudah build & deploy ke 2 HP (`flutter run`)
- [ ] HP 1: Bisa akses `http://192.168.1.10:3000/api/health` dari browser
- [ ] HP 2: Bisa akses `http://192.168.1.10:3000/api/health` dari browser

---

## 📋 Expected Flow

```
Timeline:
0s    → HP 1: User tap "Generate QR"
1s    → HP 1: App create JSON {userId, plate, gate, exp}
2s    → HP 1: User tap "SCAN & REQUEST"
3s    → HP 1: Send POST /api/gate/scan-qr ke backend
4s    → Backend: Parse & validate JSON
5s    → Backend: Publish MQTT ke ESP32
6s    → Backend: Return response ke HP 1
7s    → HP 1: Show dialog "Gate Access Granted"

Logs:
Backend console: 📱 QR Scan Request Received
Backend console: ✅ QR Validation Success
Backend console: 📡 MQTT Command Published
```

---

## 🚨 Common Issues

| Issue | Fix |
|-------|-----|
| **"Connection refused"** | Pastikan HP 1 & 2 WiFi same network as laptop |
| **"timeout"** | Backend tidak running. Jalankan `npm start` |
| **Teman update code tapi HP masih pakai URL lama** | `flutter clean` → `flutter pub get` → `flutter run` |
| **HP 1 bisa akses API tapi HP 2 tidak** | Cek apakah HP 2 terhubung ke WiFi yang sama |
| **MQTT Command tidak sampai ke ESP32** | Cek ESP32 console, pastikan MQTT_BROKER di firmware benar |

---

## 📊 Architecture Summary

```
Teman's Setup:
├── Laptop (Developer)
│   ├── Flutter App (source code)
│   ├── lib/config/app_config.dart
│   │   └── BACKEND_URL = 'http://192.168.1.10:3000'
│   └── Build output → HP 1, HP 2
│
├── HP 1 (Generate QR)
│   ├── App berjalan
│   ├── Generate JSON payload
│   └── POST ke User's backend
│
└── HP 2 (Scan)
    ├── App berjalan
    └── Send scan result ke User's backend

User's Setup:
├── Laptop (Backend Server)
│   ├── Node.js Server :3000
│   ├── Listen dari semua network
│   ├── Validate QR
│   └── Publish MQTT ke ESP32
│
└── Terminal logs
    └── Monitor QR validation, MQTT publish, etc
```

---

## 🎬 Next Steps

1. **User:** Run backend & note IP
2. **Share IP:** User kirim IP ke Teman
3. **Teman:** Update code dengan IP
4. **Build & Test:** Flutter run ke 2 HP
5. **Monitor:** Lihat logs di User's backend terminal
6. **Iterate:** Ubah code, hot-reload, test lagi

---

## 📞 Communication Template

### User → Teman
```
"Backend saya ready di: 192.168.1.10:3000
Update Flutter code:
class AppConfig {
  static const String BACKEND_URL = 'http://192.168.1.10:3000';
}"
```

### Teman → User (When Testing)
```
"App sudah deploy ke HP 1 & HP 2.
HP 1: Generate QR
HP 2: Scan QR
Kirim hasil di konsol backend Anda."
```

---

## 🏁 Success Criteria

✅ HP 1 generate QR tanpa error
✅ HP 2 scan dan send ke backend
✅ Backend terminal show "QR Validation Success"
✅ Backend show "MQTT Command Published"
✅ ESP32 (jika ada) terima command dan buka gerbang

Jika semua ✅ → **Setup berhasil!** 🎉
