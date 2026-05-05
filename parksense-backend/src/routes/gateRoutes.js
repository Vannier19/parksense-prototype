// ============================================================
// ROUTER: Gate Access Routes
// Base URL: /api/gate
// ============================================================
const express = require('express');
const router = express.Router();

const { scanQRCode, getGateStatus } = require('../controllers/gateController');

// ============================================================
// POST /api/gate/scan-qr  → Scan QR Code
// Body: { "qrData": "JSON_STRING" }
// ============================================================
router.post('/scan-qr', scanQRCode);

// ============================================================
// GET /api/gate/status/:gateName  → Get Gate Status
// ============================================================
router.get('/status/:gateName', getGateStatus);

module.exports = router;
