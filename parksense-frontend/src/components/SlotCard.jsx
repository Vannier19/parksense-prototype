// Komponen: Satu kartu slot parkir
const SlotCard = ({ slot }) => {
  const isTerisi = slot.status === 1;

  const cardStyle = {
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    border: `2px solid ${isTerisi ? '#ef4444' : '#22c55e'}`,
    background: isTerisi ? '#450a0a' : '#052e16',
    transition: 'all 0.3s ease',
    cursor: 'default',
  };

  const badgeStyle = {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '99px',
    fontSize: '0.75rem',
    fontWeight: '700',
    background: isTerisi ? '#ef4444' : '#22c55e',
    color: 'white',
    marginTop: '8px',
  };

  const updatedTime = slot.updatedAt
    ? new Date(slot.updatedAt).toLocaleTimeString('id-ID')
    : '-';

  return (
    <div style={cardStyle}>
      {/* ID Slot */}
      <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#f1f5f9' }}>
        {slot.slot_id}
      </div>

      {/* Nama Zona */}
      <div style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 8px' }}>
        {slot.zone || 'Umum'}
      </div>

      {/* Badge Status */}
      <span style={badgeStyle}>
        {isTerisi ? '🔴 TERISI' : '🟢 KOSONG'}
      </span>

      {/* Waktu update */}
      <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '8px' }}>
        {updatedTime}
      </div>
    </div>
  );
};

export default SlotCard;