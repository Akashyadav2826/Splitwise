import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <div className="auth-left" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 32, fontSize: 28,
          }}>💸</div>

          <h1 style={{ color: 'white', fontSize: 36, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>
            Split expenses,<br />not friendships.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, margin: '0 0 48px', lineHeight: 1.7 }}>
            Track shared expenses, settle debts, and keep everyone in the loop — all in one place.
          </p>

          <div className="stat-card">
            <div style={{ fontSize: 28 }}>👥</div>
            <div>
              <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: 15 }}>Group Expenses</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>Create groups for trips, flatmates, events</p>
            </div>
          </div>

          <div className="stat-card">
            <div style={{ fontSize: 28 }}>⚖️</div>
            <div>
              <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: 15 }}>Smart Splitting</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>Equal, exact, percentage or share-based</p>
            </div>
          </div>

          <div className="stat-card">
            <div style={{ fontSize: 28 }}>💬</div>
            <div>
              <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: 15 }}>Real-time Chat</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>Discuss expenses with your group instantly</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 48,
        background: 'linear-gradient(160deg, #f8fafb 0%, #edf7f5 100%)',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: 18,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                boxShadow: '0 2px 8px rgba(0,168,150,0.35)',
              }}>S</div>
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--text-1)' }}>Splitwise</span>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 6px' }}>Welcome back 👋</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 15, margin: 0 }}>Sign in to your account to continue</p>
          </div>

          {error && (
            <div style={{
              background: '#fdecea', border: '1px solid #f5c6c2',
              borderRadius: 10, padding: '13px 16px', marginBottom: 22,
              fontSize: 14, color: '#c0392b', display: 'flex', alignItems: 'center', gap: 8,
            }}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password" required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', padding: '14px 20px', fontSize: 15, borderRadius: 12, marginTop: 6 }}>
              {loading ? '⏳ Signing in...' : 'Sign in →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
              No account?{' '}
              <Link to="/register" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>
                Create one free
              </Link>
            </p>
          </div>

          <div style={{
            marginTop: 40, padding: '16px 20px',
            background: 'white', borderRadius: 12,
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              What you can do
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Track group expenses instantly', 'Split bills 4 different ways', 'Chat on every expense', 'Settle debts with one click'].map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--brand)', fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
