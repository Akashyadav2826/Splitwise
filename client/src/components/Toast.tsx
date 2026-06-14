import { useEffect, useState } from 'react';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastListeners: ((toast: Toast) => void)[] = [];
let toastId = 0;

export function showToast(message: string, type: Toast['type'] = 'success') {
  const toast: Toast = { id: ++toastId, message, type };
  toastListeners.forEach(fn => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const fn = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 3500);
    };
    toastListeners.push(fn);
    return () => { toastListeners = toastListeners.filter(f => f !== fn); };
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '14px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
          color: 'white', minWidth: 280, maxWidth: 380,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'slideInRight 0.3s ease',
          background: t.type === 'success'
            ? 'linear-gradient(135deg, #00a896, #007a6e)'
            : t.type === 'error'
            ? 'linear-gradient(135deg, #e63946, #c0392b)'
            : 'linear-gradient(135deg, #457b9d, #2d6a8f)',
        }}>
          <span style={{ fontSize: 18 }}>
            {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
