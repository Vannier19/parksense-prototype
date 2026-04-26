// Mengimpor express untuk membuat router
const express = require('express');

// Membuat objek router (seperti "papan penunjuk jalan" untuk API)
const router = express.Router();

// Mengimpor fungsi-fungsi dari controller
const { getAllSlots, getSlotById, upsertSlot } = require('../controllers/slotController');

// ============================================================
// DEFINISI RUTE (URL) API
// Base URL sudah didefinisikan di server.js sebagai /api/slots
// ============================================================

// GET /api/slots       → Panggil fungsi getAllSlots
router.get('/', getAllSlots);

// GET /api/slots/A-01  → Panggil fungsi getSlotById
router.get('/:slotId', getSlotById);

// POST /api/slots      → Panggil fungsi upsertSlot
router.post('/', upsertSlot);

// Ekspor router
module.exports = router;