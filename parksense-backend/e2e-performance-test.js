// File: parksense-backend/e2e-performance-test.js
const mqtt = require('mqtt');
const io = require('socket.io-client');
const http = require('http');
require('dotenv').config();

console.log('🚀 Testing End-to-End Performance (IoT → Dashboard)...\n');

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883';
const API_URL = 'http://localhost:3000';
const WEBSOCKET_URL = 'http://localhost:3000';
const TEST_TOPIC = 'test/parking/slots';
const TOTAL_TESTS = 10;

let testResults = [];
let completedTests = 0;

// Koneksi MQTT untuk publish
const mqttClient = mqtt.connect(MQTT_BROKER);
// Koneksi WebSocket untuk subscribe update
const socketClient = io(WEBSOCKET_URL);

let isReady = false;

socketClient.on('connect', () => {
  console.log('🟢 WebSocket terhubung ke backend');
  isReady = true;
});

socketClient.on('slot_updated', (data) => {
  // Event ini dipicu saat ada update slot
  const endTime = Date.now();
  const delay = endTime - currentTestStartTime;
  
  testResults.push({
    testNumber: completedTests + 1,
    delay: delay,
    status: delay < 15000 ? '✅ OK' : '❌ LAMBAT'
  });
  
  console.log(`Test ${completedTests + 1}: Delay ${delay}ms ${testResults[testResults.length-1].status}`);
  completedTests++;
  
  if (completedTests === TOTAL_TESTS) {
    showResults();
  }
});

mqttClient.on('connect', () => {
  console.log('🟢 MQTT terhubung');
  
  if (isReady) {
    startTests();
  }
});

let currentTestStartTime = 0;

function startTests() {
  console.log(`\n📤 Mengirim ${TOTAL_TESTS} test messages via MQTT...\n`);
  
  let testCount = 0;
  const testInterval = setInterval(() => {
    testCount++;
    
    if (testCount > TOTAL_TESTS) {
      clearInterval(testInterval);
      // Tunggu semua respons WebSocket
      setTimeout(() => {
        if (completedTests < TOTAL_TESTS) {
          console.log('⏱️  Timeout menunggu respons...');
          showResults();
        }
      }, 20000);
      return;
    }
    
    currentTestStartTime = Date.now();
    
    // Simulasi data dari IoT device
    const testData = {
      slot_id: `TEST-SLOT-${testCount}`,
      status: testCount % 2 === 0 ? 'occupied' : 'available',
      zone: 'TEST_ZONE'
    };
    
    console.log(`Mengirim: ${JSON.stringify(testData)}`);
    mqttClient.publish(TEST_TOPIC, JSON.stringify(testData));
    
  }, 3000); // Jeda 3 detik antar test
}

function showResults() {
  console.log('\n\n========== HASIL TEST END-TO-END ==========\n');
  
  if (testResults.length === 0) {
    console.log('❌ Tidak ada respons yang diterima!\n');
    cleanup();
    return;
  }
  
  // Hitung statistik
  const totalDelay = testResults.reduce((a, b) => a + b.delay, 0);
  const avgDelay = totalDelay / testResults.length;
  const minDelay = Math.min(...testResults.map(t => t.delay));
  const maxDelay = Math.max(...testResults.map(t => t.delay));
  
  console.log(`Total test: ${TOTAL_TESTS}`);
  console.log(`Berhasil: ${testResults.length}`);
  console.log(`\nDelay IoT → Dashboard:`);
  console.log(`  Tercepat: ${minDelay}ms`);
  console.log(`  Terlambat: ${maxDelay}ms`);
  console.log(`  Rata-rata: ${avgDelay.toFixed(0)}ms`);
  
  // Hasil evaluasi
  console.log('\n📊 EVALUASI:');
  if (avgDelay < 15000) {
    console.log('✅ PASS - Rata-rata delay < 15 detik ✓');
  } else if (avgDelay < 30000) {
    console.log('⚠️  WARNING - Rata-rata delay antara 15-30 detik');
  } else {
    console.log('❌ FAIL - Rata-rata delay > 30 detik');
  }
  
  cleanup();
}

function cleanup() {
  socketClient.disconnect();
  mqttClient.end();
  process.exit(0);
}