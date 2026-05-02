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
  // EFFECT: Setup WebSocket listeners
  // ============================================================
  useEffect(() => {
    // Ambil data awal via REST API saat pertama kali
    fetchSlots();

    // --- Event: Koneksi berhasil ---
    socket.on('connect', () => {
      setIsConnected(true);
      addLog('🟢 WebSocket terhubung ke server');
    });

    // --- Event: Koneksi terputus ---
    socket.on('disconnect', () => {
      setIsConnected(false);
      addLog('🔴 WebSocket terputus, mencoba reconnect...');
    });

    // --- Event: Update satu slot (dari simulator/IoT) ---
    socket.on('slot_update', (response) => {
      const updatedSlot = response.data;

      // Update slot yang berubah di state
      // Jika slot belum ada, tambahkan. Jika sudah ada, update.
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

    // Cleanup: hapus listener saat komponen unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('slot_update');
    };
  }, [fetchSlots, addLog]);

  // ============================================================
  // COMPUTED VALUES: Hitung statistik dari data slots
  // ============================================================
  const stats = {
    total: slots.length,
    terisi: slots.filter((s) => s.status === 1).length,
    kosong: slots.filter((s) => s.status === 0).length,
    persenOkupansi: slots.length
      ? Math.round((slots.filter((s) => s.status === 1).length / slots.length) * 100)
      : 0,
  };

  // Kelompokkan slot berdasarkan zona
  const slotsByZone = slots.reduce((acc, slot) => {
    const zone = slot.zone || 'Umum';
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(slot);
    return acc;
  }, {});

  return {
    slots,
    stats,
    slotsByZone,
    isConnected,
    isLoading,
    activityLog,
    refetch: fetchSlots,
  };
};