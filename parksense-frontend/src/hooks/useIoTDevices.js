import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3000';

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
    isReal: false, // Data dummy dinamis
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

// Generate dummy status dinamis untuk device non-real
const generateDummyStatus = (deviceId) => {
  const statuses = ['online', 'online', 'online', 'online', 'offline']; // 80% online
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    status: randomStatus,
    battery: randomStatus === 'online' ? Math.floor(Math.random() * 40) + 60 : 0, // 60-100% or 0
    lastUpdate: `${Math.floor(Math.random() * 15) + 1} minute${Math.floor(Math.random() * 15) + 1 !== 1 ? 's' : ''} ago`,
  };
};

// Generate dummy sensor data untuk device non-real
const generateDummySensorData = (deviceId) => {
  const dummyData = generateDummyStatus(deviceId);
  return {
    occupied: Math.floor(Math.random() * 100),
    available: Math.floor(Math.random() * 150),
    occupancy: Math.floor(Math.random() * 100),
  };
};

export const useIoTDevices = () => {
  const [devices, setDevices] = useState([]);
  const [realSensorData, setRealSensorData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real sensor data dari backend untuk Labtek 5-A
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

      setRealSensorData({
        occupied,
        available: total - occupied,
        total,
        occupancy: occupancyPercent,
        battery: 85 + Math.random() * 15, // 85-100%
        status: 'online',
        lastUpdate: 'Just now',
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
        status: 'online',
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
        const dummyStatus = generateDummyStatus(key);
        return {
          ...staticData,
          status: dummyStatus.status,
          battery: dummyStatus.battery,
          lastUpdate: dummyStatus.lastUpdate,
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
