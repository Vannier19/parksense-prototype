require('dotenv').config();

const express = require('express');
const http = require('http');       // ✨ BARU: Import modul HTTP bawaan Node.js
const path = require('path');       // ✨ BARU: Import modul Path bawaan Node.js
const connectDB = require('./src/config/db');
const slotRoutes = require('./src/routes/slotRoutes');
const connectMQTT = require('./src/services/mqttService');

// ✨ BARU: Import fungsi initSocket dari socketService
const { initSocket } = require('./src/services/socketService');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(express.json());

// ✨ BARU: Izinkan Express menyajikan file statis dari folder "public"
// Ini agar file index.html bisa diakses lewat browser
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// ROUTES
// ============================================================
app.use('/api/slots', slotRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    message: '🚗 Parksense Backend API sedang berjalan!',
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// ✨ BARU: Buat HTTP Server secara eksplisit
// Sebelumnya Express yang otomatis buat server-nya
// Sekarang kita buat manual agar Socket.io bisa menumpang di server yang sama
// ============================================================
const httpServer = http.createServer(app);

// ============================================================
// MENJALANKAN SERVER
// ============================================================
connectDB().then(() => {
  // ✨ BARU: Inisialisasi Socket.io dengan httpServer (bukan app)
  initSocket(httpServer);

  // ✨ PERUBAHAN: Gunakan httpServer.listen (bukan app.listen)
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server Parksense berjalan di http://localhost:${PORT}`);
    console.log(`🖥️  Dashboard Test: http://localhost:${PORT}/index.html`);
  });

  connectMQTT();
});