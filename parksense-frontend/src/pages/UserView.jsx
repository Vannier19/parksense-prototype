import SlotCard from '../components/SlotCard';
import { useParksense } from '../hooks/useParksense';

const UserView = () => {
  const { slots, stats, slotsByZone, isConnected, isLoading } = useParksense();

  // Cari slot kosong terbaik (simulasi rekomendasi AI)
  const rekomendasiSlot = slots.find((s) => s.status === 0) || null;

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div>⏳ Memuat peta parkir...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🅿️ Parksense</h1>
        <p style={styles.subtitle}>Temukan parkir kosong di ITB</p>
        <div style={{
          ...styles.statusPill,
          background: isConnected ? '#166534' : '#7f1d1d',
          color: isConnected ? '#bbf7d0' : '#fecaca',
        }}>
          {isConnected ? '● Live' : '● Offline'}
        </div>
      </div>

      {/* Ringkasan Cepat */}
      <div style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
            {stats.kosong}
          </span>
          <span style={styles.summaryLabel}>Slot Kosong</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>
            {stats.terisi}
          </span>
          <span style={styles.summaryLabel}>Slot Terisi</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#38bdf8' }}>
            {stats.persenOkupansi}%
          </span>
          <span style={styles.summaryLabel}>Okupansi</span>
        </div>
      </div>

      {/* Rekomendasi AI */}
      {rekomendasiSlot ? (
        <div style={styles.rekomendasiBox}>
          <div style={styles.rekomendasiLabel}>✨ Rekomendasi Slot Terbaik</div>
          <div style={styles.rekomendasiSlot}>{rekomendasiSlot.slot_id}</div>
          <div style={styles.rekomendasiZone}>📍 {rekomendasiSlot.zone}</div>
          <div style={styles.rekomendasiAlasan}>
            Slot ini paling dekat dan tersedia saat ini
          </div>
          <button style={styles.navigasiBtn}>
            🗺️ Navigasi ke Sini
          </button>
        </div>
      ) : (
        <div style={styles.fullBox}>
          😔 Semua slot sedang penuh. Silakan tunggu.
        </div>
      )}

      {/* Peta Slot per Zona */}
      <h2 style={styles.sectionTitle}>Ketersediaan per Zona</h2>
      {Object.entries(slotsByZone).map(([zona, slotsInZone]) => {
        const kosong = slotsInZone.filter(s => s.status === 0).length;
        return (
          <div key={zona} style={styles.zoneBlock}>
            <div style={styles.zoneTopRow}>
              <span style={styles.zoneLabel}>📍 {zona}</span>
              <span style={{
                ...styles.zonePill,
                background: kosong > 0 ? '#14532d' : '#450a0a',
                color: kosong > 0 ? '#86efac' : '#fca5a5',
              }}>
                {kosong > 0 ? `${kosong} tersedia` : 'Penuh'}
              </span>
            </div>
            <div style={styles.miniGrid}>
              {slotsInZone.map((slot) => (
                <SlotCard key={slot.slot_id} slot={slot} />
              ))}
            </div>
          </div>
        );
      })}

    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#e2e8f0',
    padding: '20px 16px',
    fontFamily: "'Segoe UI', sans-serif",
    maxWidth: '480px',
    margin: '0 auto',
  },
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: '#0f172a', color: '#94a3b8',
  },
  header: { textAlign: 'center', marginBottom: '20px' },
  title: { fontSize: '1.8rem', fontWeight: '700', color: '#38bdf8', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '4px', fontSize: '0.9rem' },
  statusPill: {
    display: 'inline-block', padding: '4px 12px',
    borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600', marginTop: '8px',
  },
  summaryRow: { display: 'flex', gap: '12px', marginBottom: '20px' },
  summaryCard: {
    flex: 1, background: '#1e293b', borderRadius: '12px',
    padding: '14px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  summaryLabel: { fontSize: '0.7rem', color: '#64748b' },
  rekomendasiBox: {
    background: 'linear-gradient(135deg, #0c4a6e, #0e7490)',
    borderRadius: '16px', padding: '20px', marginBottom: '24px', textAlign: 'center',
  },
  rekomendasiLabel: { fontSize: '0.75rem', color: '#7dd3fc', marginBottom: '8px' },
  rekomendasiSlot: { fontSize: '2.5rem', fontWeight: '700', color: '#fff' },
  rekomendasiZone: { color: '#bae6fd', fontSize: '0.9rem', marginTop: '4px' },
  rekomendasiAlasan: { color: '#7dd3fc', fontSize: '0.8rem', margin: '8px 0 12px' },
  navigasiBtn: {
    background: '#0284c7', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '10px 20px', fontSize: '0.9rem',
    fontWeight: '600', cursor: 'pointer', width: '100%',
  },
  fullBox: {
    background: '#1e293b', borderRadius: '12px', padding: '20px',
    textAlign: 'center', color: '#94a3b8', marginBottom: '24px',
  },
  sectionTitle: { fontSize: '1rem', color: '#94a3b8', marginBottom: '12px' },
  zoneBlock: { marginBottom: '20px' },
  zoneTopRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '10px',
  },
  zoneLabel: { fontWeight: '600', color: '#cbd5e1' },
  zonePill: { fontSize: '0.75rem', padding: '3px 10px', borderRadius: '99px', fontWeight: '600' },
  miniGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '10px',
  },
};

export default UserView;