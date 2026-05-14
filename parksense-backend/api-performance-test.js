// File: parksense-backend/api-performance-test.js
const http = require('http');

console.log('🚀 Testing Backend API Response Time...\n');

const API_URL = 'http://localhost:3000/api/slots';
const TOTAL_REQUESTS = 20;
let completed = 0;
let responseTimes = [];
let errors = 0;

function testEndpoint(requestNumber) {
  const startTime = Date.now();
  
  const req = http.get(API_URL, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
      completed++;
      
      console.log(`✅ Request ${requestNumber}: ${responseTime}ms - Status ${res.statusCode}`);
      
      if (completed === TOTAL_REQUESTS) {
        showResults();
      }
    });
  });
  
  req.on('error', (error) => {
    errors++;
    completed++;
    console.log(`❌ Request ${requestNumber}: Error - ${error.message}`);
    
    if (completed === TOTAL_REQUESTS) {
      showResults();
    }
  });
  
  req.setTimeout(10000);
}

function showResults() {
  console.log('\n\n========== HASIL TEST API ==========\n');
  
  if (responseTimes.length === 0) {
    console.log('❌ Tidak ada respons yang diterima!\n');
    return;
  }
  
  // Hitung statistik
  const totalTime = responseTimes.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / responseTimes.length;
  const minTime = Math.min(...responseTimes);
  const maxTime = Math.max(...responseTimes);
  
  console.log(`Total request: ${TOTAL_REQUESTS}`);
  console.log(`Berhasil: ${responseTimes.length}`);
  console.log(`Gagal: ${errors}`);
  console.log(`\nWaktu Respons:`);
  console.log(`  Tercepat: ${minTime}ms`);
  console.log(`  Terlambat: ${maxTime}ms`);
  console.log(`  Rata-rata: ${avgTime.toFixed(0)}ms`);
  
  // Hasil evaluasi
  console.log('\n📊 EVALUASI:');
  if (avgTime < 5000) {
    console.log('✅ PASS - Rata-rata respons < 5 detik ✓');
  } else if (avgTime < 10000) {
    console.log('⚠️  WARNING - Rata-rata respons antara 5-10 detik');
  } else {
    console.log('❌ FAIL - Rata-rata respons > 10 detik');
  }
  
  process.exit(0);
}

// Mulai test - kirim 20 request dengan jeda
console.log(`📤 Mengirim ${TOTAL_REQUESTS} request ke ${API_URL}...\n`);

let counter = 0;
const interval = setInterval(() => {
  counter++;
  testEndpoint(counter);
  
  if (counter === TOTAL_REQUESTS) {
    clearInterval(interval);
  }
}, 500); // Jeda 500ms antar request