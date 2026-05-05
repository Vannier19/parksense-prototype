// Menyimpan instance Socket.io agar bisa diakses dari file lain
// Ini adalah pola "Singleton" — hanya ada satu instance di seluruh aplikasi
let io = null;

// ============================================================
// FUNGSI 1: Inisialisasi Socket.io dengan HTTP Server
// Dipanggil SEKALI dari server.js saat aplikasi pertama berjalan
// ============================================================
const initSocket = (httpServer) => {
  // Mengimpor Socket.io dan mengikatnya ke HTTP server yang sudah ada
  io = require('socket.io')(httpServer, {
    cors: {
      // Izinkan koneksi dari semua origin (domain)
      // Di production, ganti "*" dengan domain frontend-mu yang spesifik
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // ============================================================
  // EVENT: Saat ada klien (browser/app) yang baru terhubung
  // ============================================================
  io.on('connection', (socket) => {
    console.log(`🟢 [Socket.io] Klien terhubung! ID: ${socket.id}`);

    // Saat klien pertama terhubung, kirimkan snapshot data terkini
    // Ini agar layar tidak kosong saat pertama kali dibuka
    const SlotStatus = require('../models/SlotStatus');
    SlotStatus.find()
      .sort({ updatedAt: -1 })
      .then((slots) => {
        // Emit event "initial_data" khusus ke klien yang baru connect ini
        // socket.emit = kirim HANYA ke klien ini (bukan semua klien)
        socket.emit('initial_data', {
          event: 'initial_data',
          message: 'Snapshot data parkir saat ini',
          data: slots,
        });
        console.log(`📦 [Socket.io] Snapshot data dikirim ke ${socket.id}`);
      });

    // ============================================================
    // EVENT: Saat klien memutus koneksi (tutup browser, dll)
    // ============================================================
    socket.on('disconnect', () => {
      console.log(`🔴 [Socket.io] Klien terputus. ID: ${socket.id}`);
    });
  });

  console.log('✅ [Socket.io] WebSocket Server siap menerima koneksi!');
  return io;
};

// ============================================================
// FUNGSI 2: Broadcast (siaran) update ke SEMUA klien yang terhubung
// Dipanggil dari mqttService.js setiap kali ada data sensor baru
// ============================================================
const broadcastSlotUpdate = (slotData) => {
  // Pastikan io sudah diinisialisasi sebelum broadcast
  if (!io) {
    console.warn('⚠️ [Socket.io] Belum diinisialisasi, skip broadcast.');
    return;
  }

  // io.emit = kirim ke SEMUA klien yang sedang terhubung
  // 'slot_update' adalah nama event yang akan didengarkan oleh frontend
  io.emit('slot_update', {
    event: 'slot_update',
    message: `Status slot ${slotData.slot_id} diperbarui`,
    data: slotData,
    timestamp: new Date().toISOString(),
  });

  console.log(
    `📡 [Socket.io] Broadcast → slot_update: ${slotData.slot_id} = ${
      slotData.status === 1 ? '🔴 TERISI' : '🟢 KOSONG'
    }`
  );
};

// ============================================================
// FUNGSI 3: Broadcast gate events ke SEMUA klien yang terhubung
// Dipanggil dari gateController.js setiap kali ada QR scan atau gate event
// ============================================================
const broadcastGateEvent = (eventType, eventData) => {
  // Pastikan io sudah diinisialisasi sebelum broadcast
  if (!io) {
    console.warn('⚠️ [Socket.io] Belum diinisialisasi, skip broadcast.');
    return;
  }

  // io.emit = kirim ke SEMUA klien yang sedang terhubung
  io.emit('gate_event', {
    event: eventType,
    data: eventData,
    timestamp: new Date().toISOString(),
  });

  console.log(
    `📡 [Socket.io] Broadcast → gate_event: ${eventType}`,
    eventData
  );
};

// Ekspor fungsi
module.exports = { initSocket, broadcastSlotUpdate, broadcastGateEvent };