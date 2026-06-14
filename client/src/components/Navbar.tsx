import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: 16,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          boxShadow: '0 2px 8px rgba(0,168,150,0.35)',
        }}>S</div>
        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
          Splitwise
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--brand-light), #b2ede8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--brand-dark)', fontWeight: 700, fontSize: 13,
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)' }}>{user.name}</span>
          </div>
        )}
        <button onClick={handleLogout} style={{
          background: 'var(--surface-3)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '7px 16px',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-2)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-3)')}>
          Logout
        </button>
      </div>
    </nav>
  );
}
