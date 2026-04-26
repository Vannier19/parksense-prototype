// Mengimpor mongoose untuk membuat blueprint/skema data
const mongoose = require('mongoose');

// Mendefinisikan skema (struktur/blueprint) data untuk setiap slot parkir
// Bayangkan ini seperti membuat template kolom di spreadsheet Excel
const slotStatusSchema = new mongoose.Schema(
  {
    // ID unik untuk setiap slot, contoh: "A-01", "B-03"
    slot_id: {
      type: String,
      required: true, // Wajib diisi, tidak boleh kosong
      trim: true,     // Hapus spasi di awal/akhir secara otomatis
    },

    // Status slot: 1 = Terisi (ada kendaraan), 0 = Kosong
    status: {
      type: Number,
      required: true,
      enum: [0, 1], // Hanya boleh bernilai 0 atau 1
    },

    // Zona/area parkir, contoh: "Labtek V", "GKUT"
    zone: {
      type: String,
      default: 'Umum', // Nilai default jika tidak dikirimkan
    },
  },
  {
    // Secara otomatis menambahkan field "createdAt" dan "updatedAt"
    // Ini berguna untuk melacak kapan data terakhir diubah
    timestamps: true,
  }
);

// Membuat "Model" dari skema di atas
// Model inilah yang kita pakai untuk baca/tulis data ke database
// Nama koleksi di MongoDB akan otomatis menjadi "slotstatuses"
const SlotStatus = mongoose.model('SlotStatus', slotStatusSchema);

// Ekspor model agar bisa dipakai di file lain
module.exports = SlotStatus;