require('dotenv').config();

const express = require('express');
const http    = require('http');
const path    = require('path');
const cors    = require('cors'); // ✨ BARU

const connectDB       = require('./src/config/db');
const slotRoutes      = require('./src/routes/slotRoutes');
const gateRoutes      = require('./src/routes/gateRoutes');
const connectMQTT     = require('./src/services/mqttService');
const { initSocket }  = require('./src/services/socketService');

const app  = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================

// ✨ Izinkan semua origin mengakses API ini (penting untuk React dev server)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());

// Sajikan file statis dari folder public (dashboard lama tetap bisa diakses)
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// ROUTES
// ============================================================
app.use('/api/slots', slotRoutes);
app.use('/api/gate', gateRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    message: '🚗 Parksense Backend API berjalan!',
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// HTTP SERVER + SOCKET.IO + MQTT
// ============================================================
const httpServer = http.createServer(app);

connectDB().then(() => {
  // ✨ Tambahkan CORS juga ke Socket.io
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`🖥️  Dashboard lama: http://localhost:${PORT}/index.html`);
  });

  connectMQTT();
});