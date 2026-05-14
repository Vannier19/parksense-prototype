// File: parksense-backend/db-performance-test.js
const mongoose = require('mongoose');
require('dotenv').config();

const SlotStatus = require('./src/models/SlotStatus');

console.log('🚀 Testing Database Upsert Performance...\n');

const TOTAL_OPERATIONS = 15;
let completed = 0;
let operationTimes = [];

async function runTest() {
  try {
    // Koneksi ke MongoDB
    console.log('📡 Menghubungkan ke MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Terhubung ke MongoDB\n');
    
    console.log(`📤 Melakukan ${TOTAL_OPERATIONS} operasi upsert...\n`);
    
    // Lakukan upsert berulang kali
    for (let i = 1; i <= TOTAL_OPERATIONS; i++) {
      const slotId = `TEST-${i}`;
      const startTime = Date.now();
      
      // Operasi upsert (update atau create jika tidak ada)
      await SlotStatus.updateOne(
        { slot_id: slotId },
        {
          slot_id: slotId,
          status: i % 2 === 0 ? 1 : 0,
          zone: 'TEST_ZONE',
          updatedAt: new Date(),
        },
        { upsert: true } // Ini adalah "upsert" - update atau insert
      );
      
      const operationTime = Date.now() - startTime;
      operationTimes.push(operationTime);
      
      console.log(`✅ Upsert ${i}: ${operationTime}ms (slot: ${slotId})`);
    }
    
    showResults();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function showResults() {
  console.log('\n\n========== HASIL TEST DATABASE ==========\n');
  
  // Hitung statistik
  const totalTime = operationTimes.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / operationTimes.length;
  const minTime = Math.min(...operationTimes);
  const maxTime = Math.max(...operationTimes);
  
  console.log(`Total operasi: ${TOTAL_OPERATIONS}`);
  console.log(`Berhasil: ${operationTimes.length}`);
  console.log(`\nWaktu per Operasi:`);
  console.log(`  Tercepat: ${minTime}ms`);
  console.log(`  Terlambat: ${maxTime}ms`);
  console.log(`  Rata-rata: ${avgTime.toFixed(0)}ms`);
  console.log(`  Total waktu: ${totalTime}ms`);
  
  // Hasil evaluasi
  console.log('\n📊 EVALUASI:');
  if (avgTime < 5000) {
    console.log('✅ PASS - Rata-rata upsert < 5 detik ✓');
  } else if (avgTime < 10000) {
    console.log('⚠️  WARNING - Rata-rata upsert antara 5-10 detik');
  } else {
    console.log('❌ FAIL - Rata-rata upsert > 10 detik');
  }
  
  mongoose.connection.close();
  process.exit(0);
}

// Mulai test
runTest();