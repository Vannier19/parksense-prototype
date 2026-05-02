import StatsBar    from '../components/StatsBar';
import SlotCard    from '../components/SlotCard';
import ActivityLog from '../components/ActivityLog';
import { useParksense } from '../hooks/useParksense';

const AdminDashboard = () => {
  const { slots, stats, slotsByZone, isConnected, isLoading, activityLog } = useParksense();

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}>⏳</div>
        <p>Memuat data parkir...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🚗 Parksense Admin Dashboard</h1>
          <p style={styles.subtitle}>Pemantauan Parkir ITB — Real-time</p>
        </div>
        <div style={{
          ...styles.statusBadge,
          background: isConnected ? '#166534' : '#7f1d1d',
          color: isConnected ? '#bbf7d0' : '#fecaca',
        }}>
          {isConnected ? '🟢 WebSocket Aktif' : '🔴 Terputus'}
        </div>
      </div>

      {/* Bar Statistik */}
      <StatsBar stats={stats} isConnected={isConnected} />

      {/* Grid Slot per Zona */}
      {Object.entries(slotsByZone).map(([zona, slotsInZone]) => (
        <div key={zona} style={styles.zoneSection}>

          {/* Header Zona */}
          <div style={styles.zoneHeader}>
            <h2 style={styles.zoneName}>📍 {zona}</h2>
            <span style={styles.zoneStats}>
              {slotsInZone.filter(s => s.status === 0).length} kosong
              {' / '}
              {slotsInZone.length} total
            </span>
          </div>

          {/* Grid Kartu Slot */}
          <div style={styles.slotGrid}>
            {slotsInZone.map((slot) => (
              <SlotCard key={slot.slot_id} slot={slot} />
            ))}
          </div>

        </div>
      ))}

      {/* Log Aktivitas */}
      <ActivityLog logs={activityLog} />

    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#e2e8f0',
    padding: '24px',
    fontFamily: "'Segoe UI', sans-serif",
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#0f172a',
    color: '#94a3b8',
    gap: '16px',
  },
  spinner: { fontSize: '3rem' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: { fontSize: '1.6rem', fontWeight: '700', color: '#38bdf8', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '4px', fontSize: '0.9rem' },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '99px',
    fontSize: '0.85rem',
    fontWeight: '600',
    alignSelf: 'center',
  },
  zoneSection: { marginBottom: '28px' },
  zoneHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '8px',
  },
  zoneName: { fontSize: '1.1rem', fontWeight: '600', color: '#cbd5e1', margin: 0 },
  zoneStats: {
    fontSize: '0.8rem',
    color: '#64748b',
    background: '#1e293b',
    padding: '2px 10px',
    borderRadius: '99px',
  },
  slotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px',
  },
};

export default AdminDashboard;