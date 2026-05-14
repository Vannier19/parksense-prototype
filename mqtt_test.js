const mqtt = require('mqtt');

console.log('🚀 Testing MQTT...');

const client = mqtt.connect('mqtt://broker.hivemq.com:1883');
let count = 0;
let success = 0;
let messages = [];

client.on('connect', () => {
  console.log('✅ Terhubung ke MQTT Broker\n');
  
  // Subscribe untuk receive
  client.subscribe('test/latency');
  
  // Mulai kirim pesan
  console.log('📤 Mengirim 10 pesan test...\n');
  
  let sendCount = 0;
  setInterval(() => {
    sendCount++;
    if (sendCount > 10) {
      setTimeout(() => {
        showResult();
        client.end();
        process.exit();
      }, 3000);
      return;
    }
    
    const waktuKirim = Date.now();
    const pesan = JSON.stringify({
      nomor: sendCount,
      waktu: waktuKirim
    });
    
    client.publish('test/latency', pesan);
    console.log(`Pesan ${sendCount} dikirim pada ${waktuKirim}`);
  }, 2000);
});

client.on('message', (topic, payload) => {
  const data = JSON.parse(payload.toString());
  const waktuTerima = Date.now();
  const selisih = waktuTerima - data.waktu;
  
  messages.push({
    nomor: data.nomor,
    durasi: selisih,
    status: selisih < 10000 ? '✅ OK' : '❌ LAMBAT'
  });
  
  success++;
  console.log(`Pesan ${data.nomor} diterima: ${selisih}ms ${messages[messages.length-1].status}`);
});

function showResult() {
  console.log('\n\n========== HASIL TEST MQTT ==========\n');
  
  if (messages.length === 0) {
    console.log('❌ Tidak ada pesan yang diterima!\n');
    return;
  }
  
  // Hitung rata-rata
  const totalWaktu = messages.reduce((a, b) => a + b.durasi, 0);
  const rataRata = totalWaktu / messages.length;
  
  console.log(`Total pesan: 10`);
  console.log(`Diterima: ${messages.length}`);
  console.log(`Hilang: ${10 - messages.length}`);
  console.log(`\nWaktu pengiriman:`);
  console.log(`  Tercepat: ${Math.min(...messages.map(m => m.durasi))}ms`);
  console.log(`  Terlambat: ${Math.max(...messages.map(m => m.durasi))}ms`);
  console.log(`  Rata-rata: ${rataRata.toFixed(0)}ms`);
  
  const packetLoss = ((10 - messages.length) / 10) * 100;
  console.log(`\nPacket Loss: ${packetLoss.toFixed(1)}%`);
  
  // Hasil
  console.log('\n📊 HASIL:');
  if (rataRata < 10000 && packetLoss < 2) {
    console.log('✅ PASS - Target tercapai!');
  } else {
    console.log('❌ FAIL - Ada yang perlu diperbaiki');
  }
}