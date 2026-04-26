// Mengimpor library mongoose untuk koneksi ke MongoDB
const mongoose = require('mongoose');

// Membuat fungsi yang bertugas menghubungkan aplikasi ke database
const connectDB = async () => {
  try {
    // Mencoba membuka koneksi menggunakan URL dari file .env
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    // Jika berhasil, tampilkan pesan sukses di terminal
    console.log(`✅ MongoDB Terhubung: ${conn.connection.host}`);
  } catch (error) {
    // Jika gagal, tampilkan pesan error dan hentikan aplikasi
    console.error(`❌ Error koneksi MongoDB: ${error.message}`);
    process.exit(1); // Angka 1 artinya "berhenti karena ada error"
  }
};

// Ekspor fungsi ini agar bisa dipakai di file lain
module.exports = connectDB;