import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

// URL backend kita — sesuaikan jika berbeda
const BACKEND_URL = 'http://localhost:3000';

// Buat koneksi WebSocket SEKALI saja di luar komponen
// agar tidak disconnect-reconnect setiap render
const socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
});

export const useParksense = () => {
  // State utama: daftar semua slot parkir
  const [slots, setSlots] = useState([]);

  // State status koneksi WebSocket
  const [isConnected, setIsConnected] = useState(false);

  // State loading saat pertama kali fetch data
  const [isLoading, setIsLoading] = useState(true);

  // State log aktivitas (maks 20 entri terbaru)
  const [activityLog, setActivityLog] = useState([]);

  // ============================================================
  // FUNGSI HELPER: Tambah log baru
  // ============================================================
  const addLog = useCallback((message) => {
    const waktu = new Date().toLocaleTimeString('id-ID');
    setActivityLog((prev) => [
      { id: Date.now(), waktu, message },
      ...prev.slice(0, 19), // Simpan maks 20 entri
    ]);
  }, []);

  // ============================================================
  // FUNGSI: Ambil semua data slot dari REST API
  // ============================================================
  const fetchSlots = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/slots`);
      setSlots(response.data.data || []);
      addLog(`Data awal dimuat: ${response.data.count} slot parkir`);
    } catch (error) {
      console.error('Gagal fetch data:', error.message);
      addLog('⚠️ Gagal memuat data awal dari API');
    } finally {
      setIsLoading(false);
    }
  }, [addLog]);

  // ============================================================
  // EFFECT: Initial data fetch on mount
  // ============================================================
  useEffect(() => {
    // Fetch initial data on mount
    // eslint-disable-next-line
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // EFFECT: Setup WebSocket listeners
  // ============================================================
  useEffect(() => {
    // ✨ Tambah log untuk debug
    console.log('🔌 Setup WebSocket listeners...');

  socket.on('connect', () => {
    console.log('✅ WebSocket TERHUBUNG! Socket ID:', socket.id);
    setIsConnected(true);
    addLog('🟢 WebSocket terhubung ke server');
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ WebSocket TERPUTUS! Alasan:', reason);
    setIsConnected(false);
    addLog('🔴 WebSocket terputus, mencoba reconnect...');
  });

  socket.on('connect_error', (error) => {
    // ✨ Tangkap error koneksi
    console.error('❌ WebSocket ERROR:', error.message);
    addLog(`❌ Gagal konek WebSocket: ${error.message}`);
  });

  socket.on('initial_data', (response) => {
    // ✨ Cek apakah snapshot diterima
    console.log('📦 initial_data diterima:', response.data.length, 'slot');
    response.data.forEach((slot) => {
      setSlots((prev) => {
        const exists = prev.find((s) => s.slot_id === slot.slot_id);
        if (exists) return prev.map((s) => s.slot_id === slot.slot_id ? slot : s);
        return [...prev, slot];
      });
    });
  });

  socket.on('slot_update', (response) => {
    const updatedSlot = response.data;
    // ✨ Cek apakah update diterima
    console.log('📡 slot_update diterima:', updatedSlot.slot_id, '=', updatedSlot.status);

    setSlots((prevSlots) => {
      const exists = prevSlots.find((s) => s.slot_id === updatedSlot.slot_id);
      if (exists) {
        return prevSlots.map((s) =>
          s.slot_id === updatedSlot.slot_id ? updatedSlot : s
        );
      } else {
        return [...prevSlots, updatedSlot];
      }
    });

    const statusText = updatedSlot.status === 1 ? '🔴 TERISI' : '🟢 KOSONG';
    addLog(`Slot ${updatedSlot.slot_id} → ${statusText} (${updatedSlot.zone})`);
  });

  return () => {
    console.log('🧹 Cleanup WebSocket listeners');
    socket.off('connect');
    socket.off('disconnect');
    socket.off('connect_error');
    socket.off('initial_data');
    socket.off('slot_update');
  };
}, [addLog]);

  // Return hook values
  return {
    slots,
    isConnected,
    isLoading,
    activityLog,
    stats: {
      kosong: slots.filter((s) => s.status === 0).length,
      terisi: slots.filter((s) => s.status === 1).length,
      persenOkupansi: slots.length > 0 ? Math.round((slots.filter((s) => s.status === 1).length / slots.length) * 100) : 0,
    },
    slotsByZone: slots.reduce((acc, slot) => {
      if (!acc[slot.zone]) acc[slot.zone] = [];
      acc[slot.zone].push(slot);
      return acc;
    }, {}),
  };
};