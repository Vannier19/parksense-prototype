// ============================================================
// CONTROLLER: Gate Access - Handle QR Code Scan & Gate Control
// ============================================================
const { broadcastGateEvent } = require('../services/socketService');
const mqtt = require('mqtt');

// Cache untuk QR codes yang sudah di-scan (untuk mencegah duplicate)
const scannedQRCache = new Map(); // { qrHash -> { scannedAt, userId, plate, gate } }
const QR_DUPLICATE_WINDOW_MS = 2000; // Window untuk cegah duplicate scan

// Parse QR payload and validate
const parseAndValidateQR = (qrData) => {
  try {
    // Coba parse JSON dari QR code
    const payload = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    
    // Validasi struktur payload
    if (!payload.userId || !payload.plate || !payload.gate || !payload.exp) {
      return {
        valid: false,
        error: 'Missing required fields: userId, plate, gate, exp',
      };
    }
    
    // Cek expiry (dalam milliseconds)
    const now = Date.now();
    const exp = typeof payload.exp === 'string' ? parseInt(payload.exp, 10) : payload.exp;
    
    if (exp < now) {
      return {
        valid: false,
        error: 'QR code expired',
        expiredAt: new Date(exp).toISOString(),
      };
    }
    
    // Cek format plate
    if (!/^[A-Z]\s?\d+\s?[A-Z]{1,3}$/.test(payload.plate.toUpperCase())) {
      return {
        valid: false,
        error: 'Invalid plate format',
      };
    }
    
    // Cek gate name
    const validGates = ['Gate A', 'Gate B', 'Gate C', 'Main Gate', 'Service Gate'];
    if (!validGates.includes(payload.gate)) {
      return {
        valid: false,
        error: `Invalid gate. Must be one of: ${validGates.join(', ')}`,
      };
    }
    
    return {
      valid: true,
      payload: {
        userId: payload.userId,
        plate: payload.plate.toUpperCase(),
        gate: payload.gate,
        exp: exp,
        scannedAt: now,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to parse QR: ${error.message}`,
    };
  }
};

// Generate hash untuk deteksi duplicate
const generateQRHash = (payload) => {
  return `${payload.userId}:${payload.plate}:${Math.floor(payload.exp / 10000)}`; // Hash ignoring milliseconds for grouping
};

// ============================================================
// ENDPOINT 1: Scan QR Code
// POST /api/gate/scan-qr
// Body: { "qrData": "{\"userId\":\"...\",\"plate\":\"...\",\"gate\":\"...\",\"exp\":...}" }
// ============================================================
const scanQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'Missing qrData in request body',
      });
    }
    
    console.log(`\n📱 QR Scan Request Received:`);
    console.log(`   Raw Data: ${qrData}`);
    
    // Validasi QR code
    const validation = parseAndValidateQR(qrData);
    
    if (!validation.valid) {
      console.log(`❌ QR Validation Failed: ${validation.error}`);
      
      // Broadcast ke frontend untuk feedback
      broadcastGateEvent('qr_scan_result', {
        success: false,
        reason: validation.error,
        timestamp: new Date().toISOString(),
      });
      
      return res.status(400).json({
        success: false,
        message: validation.error,
        reason: validation.error,
      });
    }
    
    const { payload } = validation;
    const qrHash = generateQRHash(payload);
    
    // Deteksi duplicate scan
    const cached = scannedQRCache.get(qrHash);
    if (cached && Date.now() - cached.scannedAt < QR_DUPLICATE_WINDOW_MS) {
      console.log(`⚠️ Duplicate QR scan detected (within ${QR_DUPLICATE_WINDOW_MS}ms)`);
      
      return res.status(409).json({
        success: false,
        message: 'Duplicate scan - please wait before scanning again',
        reason: 'DUPLICATE_SCAN',
        retryAfter: Math.ceil((QR_DUPLICATE_WINDOW_MS - (Date.now() - cached.scannedAt)) / 1000),
      });
    }
    
    // Simpan ke cache
    scannedQRCache.set(qrHash, {
      scannedAt: Date.now(),
      userId: payload.userId,
      plate: payload.plate,
      gate: payload.gate,
    });
    
    // Cleanup cache setelah window expires
    setTimeout(() => scannedQRCache.delete(qrHash), QR_DUPLICATE_WINDOW_MS);
    
    console.log(`✅ QR Validation Success:`);
    console.log(`   User ID: ${payload.userId}`);
    console.log(`   Plate: ${payload.plate}`);
    console.log(`   Gate: ${payload.gate}`);
    console.log(`   Expires: ${new Date(payload.exp).toISOString()}`);
    
    // Publish MQTT command ke ESP32 gate
    const gateTopic = `parksense/gate/${payload.gate.toLowerCase().replace(' ', '_')}/command`;
    const gateCommand = {
      action: 'OPEN_GATE',
      userId: payload.userId,
      plate: payload.plate,
      allowedDurationSeconds: 10, // Servo stay open untuk 10 detik
      timestamp: Date.now(),
    };
    
    try {
      const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL);
      
      mqttClient.on('connect', () => {
        console.log(`🔌 MQTT Connected. Publishing to: ${gateTopic}`);
        mqttClient.publish(gateTopic, JSON.stringify(gateCommand), { qos: 1 }, (err) => {
          if (err) {
            console.error(`❌ MQTT Publish Failed: ${err.message}`);
          } else {
            console.log(`📡 MQTT Command Published: ${JSON.stringify(gateCommand)}`);
          }
          mqttClient.end();
        });
      });
      
      mqttClient.on('error', (err) => {
        console.error(`❌ MQTT Connection Error: ${err.message}`);
        mqttClient.end();
      });
    } catch (mqttErr) {
      console.error(`❌ Failed to publish MQTT: ${mqttErr.message}`);
    }
    
    // Broadcast success event ke frontend
    broadcastGateEvent('qr_scan_result', {
      success: true,
      userId: payload.userId,
      plate: payload.plate,
      gate: payload.gate,
      action: 'OPENING',
      message: `Gate ${payload.gate} opening for ${payload.plate}`,
      timestamp: new Date().toISOString(),
    });
    
    // Response ke mobile app
    res.status(200).json({
      success: true,
      message: 'QR code valid, gate command sent',
      action: 'OPENING',
      gate: payload.gate,
      plate: payload.plate,
      duration: 'Until vehicle exits',
    });
    
  } catch (error) {
    console.error(`❌ Error in scanQRCode: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Server error while processing QR code',
      error: error.message,
    });
  }
};

// ============================================================
// ENDPOINT 2: Get Gate Status
// GET /api/gate/status/:gateName
// ============================================================
const getGateStatus = async (req, res) => {
  try {
    const { gateName } = req.params;
    
    console.log(`📍 Gate Status Request: ${gateName}`);
    
    // TODO: Jika ada database gate status, query dari sini
    const gateStatus = {
      name: gateName,
      status: 'closed',
      lastOpened: null,
      vehicleDetected: false,
      qrValidated: false,
      timestamp: new Date().toISOString(),
    };
    
    res.status(200).json({
      success: true,
      data: gateStatus,
    });
  } catch (error) {
    console.error(`❌ Error in getGateStatus: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving gate status',
      error: error.message,
    });
  }
};

// Ekspor controller
module.exports = {
  scanQRCode,
  getGateStatus,
  parseAndValidateQR,
};
