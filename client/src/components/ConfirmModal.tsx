interface Props {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, message, onConfirm, onCancel }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onCancel}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        animation: 'fadeIn 0.2s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: 'var(--text-1)' }}>{title}</h3>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '12px 20px', borderRadius: 12,
            border: '1.5px solid var(--border)', background: 'white',
            fontSize: 14, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer',
            fontFamily: 'inherit',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '12px 20px', borderRadius: 12,
            border: 'none', background: 'linear-gradient(135deg, #e63946, #c0392b)',
            fontSize: 14, fontWeight: 700, color: 'white', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(230,57,70,0.4)', fontFamily: 'inherit',
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}
