import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3000';
const SENSOR_STALE_THRESHOLD_MS = 90 * 1000;

// Device statis definitions untuk semua sensor
const STATIC_DEVICES = {
  'device-001': {
    id: 'device-001',
    name: 'Sensor Labtek 5 - A',
    location: 'Labtek 5',
    version: '2.1.0',
    lat: -6.8911,
    lng: 107.6119,
    isReal: true, // Data dari sensor fisik
  },
  'device-002': {
    id: 'device-002',
    name: 'Sensor Labtek 5 - B',
    location: 'Labtek 5',
    version: '2.1.0',
    lat: -6.8911,
    lng: 107.6119,
    isReal: true, // Data real dari sensor fisik Labtek 5-B
  },
  'device-003': {
    id: 'device-003',
    name: 'Sensor Labtek 8 - A',
    location: 'Labtek 8',
    version: '2.1.0',
    lat: -6.8909,
    lng: 107.6105,
    isReal: false,
  },
  'device-004': {
    id: 'device-004',
    name: 'Sensor Labtek 8 - B',
    location: 'Labtek 8',
    version: '2.1.0',
    lat: -6.8909,
    lng: 107.6105,
    isReal: false,
  },
  'device-005': {
    id: 'device-005',
    name: 'Sensor GKUT - A',
    location: 'GKUT',
    version: '2.1.0',
    lat: -6.8925,
    lng: 107.6098,
    isReal: false,
  },
  'device-006': {
    id: 'device-006',
    name: 'Sensor GKUT - B',
    location: 'GKUT',
    version: '2.1.0',
    lat: -6.8925,
    lng: 107.6098,
    isReal: false,
  },
  'device-007': {
    id: 'device-007',
    name: 'Sensor Gerbang - A',
    location: 'Sensor Gerbang',
    version: '2.1.0',
    lat: -6.8935,
    lng: 107.6108,
    isReal: false,
  },
  'device-008': {
    id: 'device-008',
    name: 'Sensor Gerbang - B',
    location: 'Sensor Gerbang',
    version: '2.1.0',
    lat: -6.8935,
    lng: 107.6108,
    isReal: false,
  },
};

const DUMMY_DEVICE_PROFILES = {
  'device-003': { total: 24, occupancyMin: 0.25, occupancyMax: 0.7, batteryMin: 74, batteryMax: 97, offlineChance: 0.08, lagMin: 1, lagMax: 4 },
  'device-004': { total: 24, occupancyMin: 0.2, occupancyMax: 0.65, batteryMin: 72, batteryMax: 96, offlineChance: 0.1, lagMin: 1, lagMax: 5 },
  'device-005': { total: 18, occupancyMin: 0.3, occupancyMax: 0.8, batteryMin: 68, batteryMax: 95, offlineChance: 0.07, lagMin: 1, lagMax: 4 },
  'device-006': { total: 18, occupancyMin: 0.25, occupancyMax: 0.75, batteryMin: 70, batteryMax: 94, offlineChance: 0.09, lagMin: 1, lagMax: 5 },
  'device-007': { total: 12, occupancyMin: 0.15, occupancyMax: 0.6, batteryMin: 76, batteryMax: 99, offlineChance: 0.05, lagMin: 0, lagMax: 3 },
  'device-008': { total: 12, occupancyMin: 0.1, occupancyMax: 0.55, batteryMin: 75, batteryMax: 98, offlineChance: 0.06, lagMin: 0, lagMax: 3 },
};

const getDummyProfile = (deviceId) => {
  return DUMMY_DEVICE_PROFILES[deviceId] || {
    total: 20,
    occupancyMin: 0.2,
    occupancyMax: 0.7,
    batteryMin: 70,
    batteryMax: 96,
    offlineChance: 0.08,
    lagMin: 1,
    lagMax: 4,
  };
};

const createSeed = (deviceId, bucket) => {
  const input = `${deviceId}:${bucket}`;
  let seed = 0;

  for (let index = 0; index < input.length; index += 1) {
    seed = (seed * 31 + input.charCodeAt(index)) >>> 0;
  }

  return seed;
};

const seededRandom = (seed) => {
  const raw = Math.sin(seed) * 10000;
  return raw - Math.floor(raw);
};

const randomIntFromSeed = (seed, min, max) => {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
};

// Generate dummy status yang stabil per interval 10 detik untuk device non-real
const generateDummyStatus = (deviceId) => {
  const profile = getDummyProfile(deviceId);
  const bucket = Math.floor(Date.now() / 10000);
  const seed = createSeed(deviceId, bucket);
  const randomStatus = seededRandom(seed) < profile.offlineChance ? 'offline' : 'online';
  const offlineAge = randomIntFromSeed(seed + 1, 2, 12);
  const battery = randomIntFromSeed(seed + 2, profile.batteryMin, profile.batteryMax);
  const lagMinutes = randomIntFromSeed(seed + 3, profile.lagMin, profile.lagMax);
  
  return {
    status: randomStatus,
    battery: randomStatus === 'online' ? battery : Math.max(0, 100 - offlineAge * 8),
    lastUpdate: randomStatus === 'online'
      ? `${lagMinutes} minute${lagMinutes !== 1 ? 's' : ''} ago`
      : `${offlineAge} minute${offlineAge !== 1 ? 's' : ''} ago`,
  };
};

// Generate dummy sensor data untuk device non-real
const generateDummySensorData = (deviceId) => {
  const profile = getDummyProfile(deviceId);
  const dummyStatus = generateDummyStatus(deviceId);
  const bucket = Math.floor(Date.now() / 10000);
  const seed = createSeed(`${deviceId}:sensor`, bucket);
  const occupancyRatio = profile.occupancyMin + (seededRandom(seed) * (profile.occupancyMax - profile.occupancyMin));
  const occupied = Math.max(0, Math.min(profile.total, Math.round(profile.total * occupancyRatio)));
  const available = Math.max(0, profile.total - occupied);
  const occupancy = profile.total > 0 ? Math.round((occupied / profile.total) * 100) : 0;

  return {
    occupied,
    available,
    occupancy,
    ...dummyStatus,
  };
};

export const useIoTDevices = () => {
  const [devices, setDevices] = useState([]);
  const [realSensorData, setRealSensorData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real sensor data dari backend untuk Labtek 5 (dipakai oleh A dan B)
  const fetchRealSensorData = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/slots`);
      const slots = response.data.data || [];
      
      console.log('═══════════════════════════════════════════════');
      console.log('📡 FETCH /api/slots');
      console.log('═══════════════════════════════════════════════');
      console.log(`Total slots from backend: ${slots.length}`);
      
      // Show all zones and their slots
      if (slots.length > 0) {
        slots.forEach(s => {
          console.log(`  • ${s.slot_id}: zone="${s.zone}" status=${s.status}`);
        });
      }
      
      // Hitung occupancy untuk Labtek 5 (cek berbagai format zona: "Labtek 5", "Labtek V", dll)
      const labtek5Slots = slots.filter(s => 
        s.zone === 'Labtek 5' || 
        s.zone === 'Labtek V' || 
        s.zone?.includes('Labtek 5') || 
        s.zone?.includes('Labtek V')
      );
      
      console.log(`\n🅿️ Filter hasil untuk "Labtek 5":`);
      console.log(`  Found: ${labtek5Slots.length} slots`);
      labtek5Slots.forEach(s => {
        console.log(`    - ${s.slot_id}: status=${s.status}`);
      });
      
      const zoneSet = [...new Set(slots.map(s => s.zone))];
      console.log(`\n🔍 Unique zones: ${JSON.stringify(zoneSet)}`);
      console.log('═══════════════════════════════════════════════\n');
      
      const occupied = labtek5Slots.filter(s => s.status === 1).length;
      const total = labtek5Slots.length || 250; // Default 250 jika tidak ada data
      const occupancyPercent = total > 0 ? Math.round((occupied / total) * 100) : 0;
      const latestUpdate = labtek5Slots.reduce((latest, slot) => {
        const updatedAt = slot.updatedAt ? new Date(slot.updatedAt).getTime() : 0;
        return Math.max(latest, updatedAt);
      }, 0);
      const isSensorFresh = latestUpdate > 0 && (Date.now() - latestUpdate) <= SENSOR_STALE_THRESHOLD_MS;
      const sensorStatus = isSensorFresh ? 'online' : 'offline';

      setRealSensorData({
        occupied,
        available: total - occupied,
        total,
        occupancy: occupancyPercent,
        battery: 85 + Math.random() * 15, // 85-100%
        status: sensorStatus,
        lastUpdate: isSensorFresh ? 'Just now' : (latestUpdate ? new Date(latestUpdate).toLocaleTimeString('id-ID') : 'No recent data'),
      });

      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('Error fetching sensor data:', err.message);
      setIsConnected(false);
      setError(err.message);
      
      // Fallback ke dummy data jika gagal
      setRealSensorData({
        occupied: 212,
        available: 38,
        total: 250,
        occupancy: 85,
        battery: 88,
        status: 'offline',
        lastUpdate: '2 minutes ago',
      });
    }
  }, []);

  // Initialize devices dengan data real dan dummy
  const initializeDevices = useCallback(() => {
    const deviceList = Object.entries(STATIC_DEVICES).map(([key, staticData]) => {
      if (staticData.isReal) {
        // Device real: gunakan data dari backend
        return {
          ...staticData,
          status: realSensorData?.status || 'online',
          battery: realSensorData?.battery || 88,
          lastUpdate: realSensorData?.lastUpdate || '2 minutes ago',
          type: 'Parking Sensor',
        };
      } else {
        // Device dummy: generate data dinamis
        const dummyStatus = generateDummySensorData(key);
        return {
          ...staticData,
          ...dummyStatus,
          type: 'Parking Sensor',
        };
      }
    });

    setDevices(deviceList);
    setIsLoading(false);
  }, [realSensorData]);

  // On mount: fetch real data and initialize
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      await fetchRealSensorData();
    };

    initializeApp();
  }, [fetchRealSensorData]);

  // When real sensor data changes, update devices
  useEffect(() => {
    if (realSensorData || isLoading === false) {
      initializeDevices();
    }
  }, [realSensorData, initializeDevices]);

  // Refresh real sensor data every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRealSensorData();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchRealSensorData]);

  return {
    devices,
    realSensorData,
    isConnected,
    isLoading,
    error,
    refreshDevices: fetchRealSensorData,
    getDeviceData: (deviceId) => {
      const device = devices.find(d => d.id === deviceId);
      if (device?.isReal) {
        return {
          ...device,
          occupied: realSensorData?.occupied || 0,
          available: realSensorData?.available || 0,
          occupancy: realSensorData?.occupancy || 0,
        };
      } else {
        // Return dummy data untuk device non-real
        return {
          ...device,
          ...generateDummySensorData(deviceId),
        };
      }
    },
  };
};
