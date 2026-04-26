const mqtt = require('mqtt');
const SlotStatus = require('../models/SlotStatus');

// ✨ BARU: Import fungsi broadcast dari socketService
const { broadcastSlotUpdate } = require('./socketService');

const connectMQTT = () => {
  const brokerUrl = process.env.MQTT_BROKER_URL;
  const topic = process.env.MQTT_TOPIC;

  console.log(`🔌 Mencoba terhubung ke MQTT Broker: ${brokerUrl}`);

  const client = mqtt.connect(brokerUrl);

  client.on('connect', () => {
    console.log('✅ Terhubung ke MQTT Broker!');
    client.subscribe(topic, { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ Gagal subscribe ke topik:', err);
      } else {
        console.log(`👂 Sedang mendengarkan topik: ${topic}`);
      }
    });
  });

  client.on('message', async (topik, pesanBuffer) => {
    try {
      const pesanString = pesanBuffer.toString();
      const payload = JSON.parse(pesanString);

      console.log(`📨 Pesan MQTT diterima:`, payload);

      if (payload.slot_id === undefined || payload.status === undefined) {
        console.warn('⚠️ Payload tidak valid, abaikan.');
        return;
      }

      // Simpan/update ke MongoDB (sama seperti sebelumnya)
      const updatedSlot = await SlotStatus.findOneAndUpdate(
        { slot_id: payload.slot_id },
        { status: payload.status, zone: payload.zone || 'Umum' },
        { new: true, upsert: true, runValidators: true }
      );

      console.log(`💾 Data tersimpan ke DB:`, updatedSlot.toObject());

      // ✨ BARU: Setelah data tersimpan, langsung broadcast ke semua
      // klien WebSocket yang sedang membuka dashboard/aplikasi
      broadcastSlotUpdate(updatedSlot.toObject());

    } catch (error) {
      console.error('❌ Gagal memproses pesan MQTT:', error.message);
    }
  });

  client.on('error', (err) => {
    console.error('❌ Error MQTT:', err.message);
  });

  client.on('disconnect', () => {
    console.warn('⚠️ Koneksi MQTT terputus. Mencoba reconnect...');
  });
};

module.exports = connectMQTT;