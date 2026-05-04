const mqtt = require('mqtt');
const SlotStatus = require('../models/SlotStatus');

// ✨ BARU: Import fungsi broadcast dari socketService
const { broadcastSlotUpdate } = require('./socketService');

const connectMQTT = () => {
  const brokerUrl = process.env.MQTT_BROKER_URL;
  const topic = process.env.MQTT_TOPIC;

  console.log(`🔌 Mencoba terhubung ke MQTT Broker: ${brokerUrl}`);

  const client = mqtt.connect(brokerUrl);

  // ✨ BARU: Handle saat client berhasil connect
  client.on('connect', () => {
    console.log(`✅ MQTT connected! Subscribing to: ${topic}`);
    client.subscribe(topic, (err) => {
      if (err) {
        console.error(`❌ Gagal subscribe ke topic '${topic}':`, err.message);
      } else {
        console.log(`✅ Subscribed ke topic: ${topic}`);
      }
    });
  });

  client.on('message', async (topik, pesanBuffer) => {
    try {
      const pesanString = pesanBuffer.toString();
      const payload = JSON.parse(pesanString);

      // ✨ Bedakan sumber data: hardware asli atau simulator
      const sumber = payload.source === 'hardware' ? '🔧 HARDWARE' : '🤖 SIMULATOR';
      console.log(`📨 [${sumber}] Pesan MQTT diterima:`, payload);

      // ✨ Abaikan pesan heartbeat, tidak perlu disimpan ke DB
      if (payload.type === 'heartbeat') {
        console.log(`💓 Heartbeat dari ${payload.slot_id}`);
        return;
      }

      if (payload.slot_id === undefined || payload.status === undefined) {
        console.warn('⚠️ Payload tidak valid, abaikan.');
        return;
      }

      const updatedSlot = await SlotStatus.findOneAndUpdate(
        { slot_id: payload.slot_id },
        { status: payload.status, zone: payload.zone || 'Umum' },
        { returnDocument: 'after', upsert: true, runValidators: true }
      );

      console.log(`💾 Data tersimpan ke DB:`, updatedSlot.toObject());
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