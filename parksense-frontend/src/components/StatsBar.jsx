// Komponen: Bar ringkasan statistik di bagian atas dashboard
const StatsBar = ({ stats, isConnected }) => {
  return (
    <div style={styles.container}>

      {/* Kartu: Status Koneksi */}
      <div style={{ ...styles.card, borderColor: isConnected ? '#22c55e' : '#ef4444' }}>
        <div style={styles.label}>Status Sistem</div>
        <div style={{
          ...styles.value,
          color: isConnected ? '#22c55e' : '#ef4444',
          fontSize: '1rem'
        }}>
          {isConnected ? '🟢 Online' : '🔴 Offline'}
        </div>
      </div>

      {/* Kartu: Total Kapasitas */}
      <div style={styles.card}>
        <div style={styles.label}>Total Kapasitas</div>
        <div style={styles.value}>{stats.total}</div>
        <div style={styles.sublabel}>slot terdaftar</div>
      </div>

      {/* Kartu: Terisi */}
      <div style={{ ...styles.card, borderColor: '#ef4444' }}>
        <div style={styles.label}>Terisi</div>
        <div style={{ ...styles.value, color: '#ef4444' }}>{stats.terisi}</div>
        <div style={styles.sublabel}>slot terpakai</div>
      </div>

      {/* Kartu: Tersedia */}
      <div style={{ ...styles.card, borderColor: '#22c55e' }}>
        <div style={styles.label}>Tersedia</div>
        <div style={{ ...styles.value, color: '#22c55e' }}>{stats.kosong}</div>
        <div style={styles.sublabel}>slot kosong</div>
      </div>

      {/* Kartu: Okupansi */}
      <div style={styles.card}>
        <div style={styles.label}>Okupansi</div>
        <div style={styles.value}>{stats.persenOkupansi}%</div>
        <div style={styles.sublabel}>tingkat keterisian</div>
      </div>

    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '24px',
  },
  card: {
    flex: '1',
    minWidth: '130px',
    background: '#1e293b',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    border: '2px solid #334155',
  },
  label: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  value: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#f1f5f9',
  },
  sublabel: {
    fontSize: '0.7rem',
    color: '#64748b',
    marginTop: '4px',
  },
};

export default StatsBar;