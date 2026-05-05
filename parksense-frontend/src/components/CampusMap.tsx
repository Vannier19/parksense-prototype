import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css' assert { type: 'css' };

const DefaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// =====================================================
// Definisi zona parkir di peta
// "zoneKeys" harus cocok dengan nilai zone yang dikirim IoT
// IoT mengirim: zone = "Labtek 5" → cocok dengan zoneKeys: ['Labtek 5', 'Labtek V']
// =====================================================
interface ZoneDefinition {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  zoneKeys: string[]; // Nama zona yang dikirim dari IoT/backend
}

const ZONE_DEFINITIONS: ZoneDefinition[] = [
  {
    id: 'labtek5',
    name: 'Labtek 5 Parking',
    location: 'Parking Area A & B',
    lat: -6.8911,
    lng: 107.6119,
    zoneKeys: ['Labtek 5', 'Labtek V', 'labtek5', 'Labtek5'],
  },
  {
    id: 'labtek8',
    name: 'Labtek 8 Parking',
    location: 'Parking Area A & B',
    lat: -6.8909,
    lng: 107.6105,
    zoneKeys: ['Labtek 8', 'Labtek VIII', 'labtek8', 'Labtek8'],
  },
  {
    id: 'gkut',
    name: 'GKUT Parking',
    location: 'Parking Area A & B',
    lat: -6.8925,
    lng: 107.6098,
    zoneKeys: ['GKUT', 'gkut'],
  },
  {
    id: 'gerbang',
    name: 'Gate Parking',
    location: 'Parking Area A & B',
    lat: -6.8935,
    lng: 107.6108,
    zoneKeys: ['Gerbang', 'gerbang', 'Gate'],
  },
];

// =====================================================
// Props: terima slots dari parent (Dashboard)
// =====================================================
interface SlotData {
  slot_id: string;
  zone: string;
  status: number; // 0 = kosong, 1 = terisi
  updatedAt?: string;
}

interface CampusMapProps {
  slots?: SlotData[];
}

export default function CampusMap({ slots = [] }: CampusMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  // Simpan referensi setiap marker agar bisa diupdate
  const markers = useRef<Map<string, L.CircleMarker>>(new Map());

  // =====================================================
  // FUNGSI: Hitung status zona berdasarkan data slot real
  // =====================================================
  const getZoneStatus = (zoneKeys: string[]) => {
    // Cari semua slot yang termasuk zona ini
    const zoneSlots = slots.filter(slot =>
      zoneKeys.some(key =>
        slot.zone?.toLowerCase().trim() === key.toLowerCase().trim()
      )
    );

    if (zoneSlots.length === 0) {
      // Tidak ada data dari backend → abu-abu (unknown)
      return { color: '#94a3b8', label: 'No Data', occupied: 0, total: 0 };
    }

    const occupied = zoneSlots.filter(s => s.status === 1).length;
    const total = zoneSlots.length;
    const occupancyRate = total > 0 ? (occupied / total) : 0;

    if (occupancyRate === 0) {
      // Semua kosong → hijau
      return { color: '#22c55e', label: 'Available', occupied, total };
    } else if (occupancyRate < 0.7) {
      // Sebagian terisi → kuning
      return { color: '#f59e0b', label: 'Partially Occupied', occupied, total };
    } else {
      // Penuh/hampir penuh → merah
      return { color: '#ef4444', label: 'Full', occupied, total };
    }
  };

  // =====================================================
  // EFFECT: Inisialisasi peta SEKALI saat mount
  // =====================================================
  useEffect(() => {
    if (!mapContainer.current) return;

    const itbCenter: [number, number] = [-6.892, 107.6110];
    map.current = L.map(mapContainer.current).setView(itbCenter, 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // Buat marker untuk setiap zona (dengan warna awal abu-abu)
    ZONE_DEFINITIONS.forEach((zone) => {
      const circleMarker = L.circleMarker([zone.lat, zone.lng], {
        radius: 12,
        fillColor: '#94a3b8', // Abu-abu = belum ada data
        color: '#fff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.85,
      }).addTo(map.current!);

      circleMarker.bindPopup(`
        <div style="padding:8px; min-width:160px">
          <h4 style="font-weight:bold; margin-bottom:4px">${zone.name}</h4>
          <p style="font-size:12px; color:#666">${zone.location}</p>
          <p style="font-size:12px; margin-top:4px">Loading data...</p>
        </div>
      `);

      circleMarker.on('click', () => circleMarker.openPopup());

      // Simpan referensi marker dengan zone id
      markers.current.set(zone.id, circleMarker);
    });

    // Fit bounds
    const bounds = L.latLngBounds(
      ZONE_DEFINITIONS.map(z => [z.lat, z.lng] as [number, number])
    );
    map.current.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // =====================================================
  // EFFECT: Update warna marker setiap kali slots berubah
  // Ini adalah bagian yang menyambungkan IoT → Peta
  // =====================================================
  useEffect(() => {
    if (!map.current) return;

    ZONE_DEFINITIONS.forEach((zone) => {
      const marker = markers.current.get(zone.id);
      if (!marker) return;

      const zoneStatus = getZoneStatus(zone.zoneKeys);

      // Update warna marker
      marker.setStyle({
        fillColor: zoneStatus.color,
      });

      // Update konten popup dengan data terbaru
      const lastUpdate = slots
        .filter(s => zone.zoneKeys.some(k => s.zone?.toLowerCase().trim() === k.toLowerCase().trim()))
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0]?.updatedAt;

      const lastUpdateText = lastUpdate
        ? new Date(lastUpdate).toLocaleTimeString('id-ID')
        : 'No data yet';

      marker.setPopupContent(`
        <div style="padding:8px; min-width:180px">
          <h4 style="font-weight:bold; margin-bottom:4px">${zone.name}</h4>
          <p style="font-size:12px; color:#666; margin-bottom:8px">${zone.location}</p>
          <div style="font-size:12px; display:flex; flex-direction:column; gap:4px">
            <p>
              <span style="font-weight:600">Status:</span>
              <span style="color:${zoneStatus.color}; font-weight:600; margin-left:4px">
                ${zoneStatus.label}
              </span>
            </p>
            ${zoneStatus.total > 0 ? `
              <p><span style="font-weight:600">Occupied:</span> ${zoneStatus.occupied} / ${zoneStatus.total}</p>
              <p><span style="font-weight:600">Available:</span> ${zoneStatus.total - zoneStatus.occupied}</p>
            ` : '<p style="color:#94a3b8">No sensor data</p>'}
            <p style="color:#94a3b8; font-size:11px; margin-top:4px">Updated: ${lastUpdateText}</p>
          </div>
        </div>
      `);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]); // ← Trigger setiap kali slots dari IoT berubah!

  return (
    <div>
      {/* Legend warna */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {[
          { color: '#22c55e', label: 'Available' },
          { color: '#f59e0b', label: 'Partially Occupied' },
          { color: '#ef4444', label: 'Full / Occupied' },
          { color: '#94a3b8', label: 'No Sensor Data' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: item.color, border: '2px solid white',
              boxShadow: '0 0 0 2px ' + item.color + '44'
            }} />
            <span style={{ color: '#374151' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Peta */}
      <div
        ref={mapContainer}
        style={{ height: '550px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}
      />
    </div>
  );
}