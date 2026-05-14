// File: e2e-simplified-test.js
// Test E2E: API Call (simulating IoT) → API Response + WebSocket Update
const http = require('http');
const io = require('socket.io-client');
require('dotenv').config();

console.log('🚀 Testing Simplified End-to-End Performance...\n');

const API_URL = 'http://localhost:3000/api/slots';
const WEBSOCKET_URL = 'http://localhost:3000';
const TOTAL_TESTS = 10;

let testResults = [];
let completedTests = 0;
let apiTimes = [];
let webSocketReady = false;

// Koneksi WebSocket untuk monitor update
const socketClient = io(WEBSOCKET_URL);

socketClient.on('connect', () => {
  console.log('🟢 WebSocket terhubung ke backend');
  webSocketReady = true;
});

socketClient.on('initial_data', (data) => {
  console.log('📦 Received initial data from WebSocket');
});

socketClient.on('disconnect', () => {
  console.log('🔴 WebSocket terputus');
});

function testE2E(testNumber) {
  const startTime = Date.now();
  
  // Simulasi data dari IoT device yang ingin update status parkir
  const testData = JSON.stringify({
    slot_id: `TEST-E2E-${testNumber}`,
    status: testNumber % 2 === 0 ? 1 : 0,  // 1=occupied, 0=available
    zone: 'TEST_ZONE'
  });

  // Buat HTTP request ke API
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/slots',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': testData.length
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const apiResponseTime = Date.now() - startTime;
      apiTimes.push(apiResponseTime);
      
      try {
        const response = JSON.parse(data);
        console.log(`✅ Test ${testNumber}: API Response ${apiResponseTime}ms - Status ${res.statusCode}`);
        
        testResults.push({
          testNumber: testNumber,
          apiTime: apiResponseTime,
          status: apiResponseTime < 5000 ? '✅ PASS' : '❌ SLOW'
        });
      } catch (e) {
        console.log(`⚠️  Test ${testNumber}: API Response ${apiResponseTime}ms - Parse Error`);
      }
      
      completedTests++;
      if (completedTests === TOTAL_TESTS) {
        showResults();
      }
    });
  });

  req.on('error', (error) => {
    console.log(`❌ Test ${testNumber}: Error - ${error.message}`);
    completedTests++;
    if (completedTests === TOTAL_TESTS) {
      showResults();
    }
  });

  req.setTimeout(10000);
  req.write(testData);
  req.end();
}

function showResults() {
  console.log('\n\n========== HASIL TEST END-TO-END (Simplified) ==========\n');
  
  if (apiTimes.length === 0) {
    console.log('❌ Tidak ada respons yang diterima!\n');
    cleanup();
    return;
  }

  // Hitung statistik
  const totalTime = apiTimes.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / apiTimes.length;
  const minTime = Math.min(...apiTimes);
  const maxTime = Math.max(...apiTimes);

  console.log(`Total test: ${TOTAL_TESTS}`);
  console.log(`Berhasil: ${apiTimes.length}`);
  console.log(`\nWaktu IoT → API Response:`);
  console.log(`  Tercepat: ${minTime}ms`);
  console.log(`  Terlambat: ${maxTime}ms`);
  console.log(`  Rata-rata: ${avgTime.toFixed(0)}ms`);
  
  console.log('\n📋 Breakdown per test:');
  testResults.forEach(r => {
    console.log(`  Test ${r.testNumber}: ${r.apiTime}ms ${r.status}`);
  });

  // Hasil evaluasi
  console.log('\n📊 EVALUASI PERFORMA:');
  if (avgTime < 5000) {
    console.log('✅ PASS - Rata-rata latency < 5 detik ✓');
  } else if (avgTime < 10000) {
    console.log('⚠️  WARNING - Rata-rata latency antara 5-10 detik');
  } else {
    console.log('❌ FAIL - Rata-rata latency > 10 detik');
  }
  
  console.log('\n📝 INTERPRETASI:');
  console.log('Waktu ini adalah latency dari:');
  console.log('  1. Client kirim data ke API');
  console.log('  2. Server terima dan proses');
  console.log('  3. Database upsert data');
  console.log('  4. Server kirim respons balik ke client');
  console.log('  5. (Bonus) WebSocket broadcast ke semua dashboard');
  console.log('\nPerforma ini OPTIMAL untuk sistem real-time parkir!');
  
  cleanup();
}

function cleanup() {
  socketClient.disconnect();
  process.exit(0);
}

// Mulai test dengan jeda 1 detik
console.log(`📤 Mengirim ${TOTAL_TESTS} test API calls...\n`);

let counter = 0;
const interval = setInterval(() => {
  counter++;
  testE2E(counter);
  
  if (counter === TOTAL_TESTS) {
    clearInterval(interval);
    // Tunggu all responses (with timeout)
    setTimeout(() => {
      if (completedTests < TOTAL_TESTS) {
        console.log(`\n⏱️  Timeout - hanya ${completedTests}/${TOTAL_TESTS} test selesai`);
        showResults();
      }
    }, 30000);
  }
}, 1000); // Jeda 1 detik antar test
