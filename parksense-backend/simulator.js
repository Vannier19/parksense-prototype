// ============================================================
// simulator.js
// "Sensor Bohongan" — Mensimulasikan perangkat IoT ESP32
// Mengirim status slot parkir ke MQTT Broker secara otomatis
// ============================================================

// Memuat variabel dari .env (kita butuh MQTT_BROKER_URL dan MQTT_TOPIC)
require('dotenv').config();

// Mengimpor library mqtt
const mqtt = require('mqtt');

// ============================================================
// KONFIGURASI SIMULATOR
// Sesuaikan bagian ini sesuai kebutuhanmu
// ============================================================
const CONFIG = {
  brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com',
  topic: process.env.MQTT_TOPIC || 'parksense/itb/slot/status',
  intervalDetik: 5, // Kirim data baru setiap 5 detik
};

// ============================================================
// DATA SLOT PARKIR YANG AKAN DISIMULASIKAN
// Ini mewakili slot-slot parkir yang ada di kampus ITB
// ============================================================
const daftarSlot = [
  { slot_id: 'A-01', zone: 'Labtek V' },
  { slot_id: 'A-02', zone: 'Labtek V' },
  { slot_id: 'A-03', zone: 'Labtek V' },
  { slot_id: 'B-01', zone: 'Labtek VIII' },
  { slot_id: 'B-02', zone: 'Labtek VIII' },
  { slot_id: 'C-01', zone: 'GKUT' },
  { slot_id: 'C-02', zone: 'GKUT' },
  { slot_id: 'C-03', zone: 'GKUT' },
];

// ============================================================
// FUNGSI HELPER
// ============================================================

// Fungsi untuk mengambil angka acak antara min dan max (inklusif)
const acakAngka = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Fungsi untuk mengambil satu slot secara acak dari daftarSlot
const ambilSlotAcak = () => {
  const indeksAcak = acakAngka(0, daftarSlot.length - 1);
  return daftarSlot[indeksAcak];
};

// Fungsi untuk membuat payload JSON yang akan dikirim
// Menyimulasikan data yang dikirim oleh sensor ESP32
const buatPayload = (slot) => {
  return {
    slot_id: slot.slot_id,
    zone: slot.zone,
    // Status acak: 0 (Kosong) atau 1 (Terisi)
    // Seperti sensor ultrasonik yang mendeteksi ada/tidaknya kendaraan
    status: acakAngka(0, 1),
    // Tambahkan timestamp dari "perangkat"
    device_timestamp: new Date().toISOString(),
    // Tambahkan simulasi pembacaan jarak sensor (dalam cm)
    // Jika < 50cm = ada kendaraan (terisi), > 50cm = kosong
    distance_cm: acakAngka(0, 1) === 1 ? acakAngka(5, 45) : acakAngka(55, 200),
  };
};

// ============================================================
// KONEKSI KE MQTT BROKER & MULAI SIMULASI
// ============================================================
console.log('🤖 Parksense IoT Simulator sedang dijalankan...');
console.log(`📡 Menghubungkan ke broker: ${CONFIG.brokerUrl}`);
console.log(`📢 Akan publish ke topik: ${CONFIG.topic}`);
console.log(`⏱️  Interval pengiriman: setiap ${CONFIG.intervalDetik} detik\n`);

// Membuat koneksi ke MQTT Broker
const client = mqtt.connect(CONFIG.brokerUrl);

// ============================================================
// EVENT: Saat koneksi ke broker berhasil
// ============================================================
client.on('connect', () => {
  console.log('✅ Simulator terhubung ke MQTT Broker!\n');
  console.log('━'.repeat(55));

  // Jalankan sekali langsung saat pertama connect
  kirimData();

  // Kemudian ulangi setiap X detik sesuai CONFIG.intervalDetik
  setInterval(kirimData, CONFIG.intervalDetik * 1000);
});

// ============================================================
// FUNGSI UTAMA: Memilih slot acak dan mengirim datanya
// ============================================================
let hitunganKirim = 0; // Counter untuk melacak berapa kali data dikirim

const kirimData = () => {
  hitunganKirim++;

  // Pilih slot secara acak
  const slotTerpilih = ambilSlotAcak();

  // Buat payload data
  const payload = buatPayload(slotTerpilih);

  // Konversi objek JavaScript ke string JSON untuk dikirim
  const pesanJSON = JSON.stringify(payload);

  // Kirim pesan ke MQTT Broker
  // QoS 1 = pastikan pesan terkirim minimal satu kali
  client.publish(CONFIG.topic, pesanJSON, { qos: 1 }, (err) => {
    if (err) {
      console.error(`❌ Gagal mengirim data:`, err.message);
      return;
    }

    // Tampilkan log yang rapi di terminal
    const statusLabel = payload.status === 1 ? '🔴 TERISI ' : '🟢 KOSONG ';
    console.log(`[Kirim #${String(hitunganKirim).padStart(3, '0')}] ` +
      `Slot: ${payload.slot_id.padEnd(5)} | ` +
      `Zone: ${payload.zone.padEnd(12)} | ` +
      `Status: ${statusLabel} | ` +
      `Jarak: ${String(payload.distance_cm).padStart(3)}cm`
    );
  });
};

// ============================================================
// EVENT: Jika ada error koneksi
// ============================================================
client.on('error', (err) => {
  console.error('❌ Error koneksi MQTT:', err.message);
});

// ============================================================
// Tangani saat simulator dihentikan (Ctrl+C)
// ============================================================
process.on('SIGINT', () => {
  console.log('\n\n🛑 Simulator dihentikan.');
  console.log(`📊 Total data terkirim: ${hitunganKirim} pesan`);
  client.end(); // Tutup koneksi MQTT dengan bersih
  process.exit(0);
});