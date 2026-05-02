// Komponen: Log aktivitas real-time
const ActivityLog = ({ logs }) => {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📋 Log Aktivitas Real-time</h3>
      <div style={styles.logBox}>
        {logs.length === 0 ? (
          <div style={styles.empty}>Menunggu aktivitas...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} style={styles.entry}>
              <span style={styles.time}>[{log.waktu}]</span>{' '}
              <span dangerouslySetInnerHTML={{ __html: log.message }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { marginTop: '24px' },
  title: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '10px',
  },
  logBox: {
    background: '#1e293b',
    borderRadius: '8px',
    padding: '14px',
    height: '160px',
    overflowY: 'auto',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  entry: { marginBottom: '4px', lineHeight: '1.5' },
  time: { color: '#38bdf8' },
  empty: { color: '#475569', fontStyle: 'italic' },
};

export default ActivityLog;