// Mengimpor model SlotStatus yang sudah kita buat
const SlotStatus = require('../models/SlotStatus');

// ============================================================
// CONTROLLER 1: Mendapatkan semua data status slot parkir
// Dipanggil saat ada request: GET /api/slots
// ============================================================
const getAllSlots = async (req, res) => {
  try {
    // Ambil semua dokumen dari koleksi SlotStatus di database
    // .sort({ updatedAt: -1 }) artinya urutkan dari yang terbaru
    const slots = await SlotStatus.find().sort({ updatedAt: -1 });

    // Kirim respons sukses (kode 200) beserta datanya dalam format JSON
    res.status(200).json({
      success: true,
      count: slots.length, // Jumlah total slot yang ditemukan
      data: slots,
    });
  } catch (error) {
    // Jika ada error, kirim respons gagal (kode 500)
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data slot',
      error: error.message,
    });
  }
};

// ============================================================
// CONTROLLER 2: Mendapatkan data SATU slot berdasarkan slot_id
// Dipanggil saat ada request: GET /api/slots/:slotId
// Contoh: GET /api/slots/A-01
// ============================================================
const getSlotById = async (req, res) => {
  try {
    // req.params.slotId mengambil nilai dari URL, contoh: "A-01"
    const slot = await SlotStatus.findOne({ slot_id: req.params.slotId });

    // Jika slot tidak ditemukan, kirim respons 404 (Not Found)
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: `Slot dengan ID '${req.params.slotId}' tidak ditemukan`,
      });
    }

    // Jika ditemukan, kirim datanya
    res.status(200).json({
      success: true,
      data: slot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data slot',
      error: error.message,
    });
  }
};

// ============================================================
// CONTROLLER 3: Membuat atau memperbarui data slot
// Dipanggil saat ada request: POST /api/slots
// Ini adalah fungsi inti yang akan dipanggil oleh MQTT Service
// ============================================================
const upsertSlot = async (req, res) => {
  try {
    // Ambil slot_id, status, dan zone dari body request
    const { slot_id, status, zone } = req.body;

    // Validasi sederhana: pastikan slot_id dan status ada
    if (slot_id === undefined || status === undefined) {
      return res.status(400).json({
        success: false,
        message: "Field 'slot_id' dan 'status' wajib diisi",
      });
    }

    // "Upsert" = Update jika sudah ada, Insert jika belum ada
    // Cari dokumen dengan slot_id yang cocok, lalu update statusnya
    const updatedSlot = await SlotStatus.findOneAndUpdate(
      { slot_id: slot_id },           // Kondisi pencarian
      { status: status, zone: zone }, // Data yang akan diupdate
      {
        returnDocument: 'after',    // Kembalikan dokumen yang SUDAH diupdate (bukan yang lama)
        upsert: true, // Buat dokumen baru jika tidak ditemukan
        runValidators: true, // Jalankan validasi skema saat update
      }
    );

    res.status(200).json({
      success: true,
      message: `Status slot '${slot_id}' berhasil diperbarui`,
      data: updatedSlot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data slot',
      error: error.message,
    });
  }
};

// Ekspor semua fungsi controller agar bisa dipakai di routes
module.exports = { getAllSlots, getSlotById, upsertSlot };