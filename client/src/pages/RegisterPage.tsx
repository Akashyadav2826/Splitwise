import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
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
      const res = await api.post('/auth/register', { name, email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <div className="auth-left" style={{ flex: 1 }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 56, marginBottom: 24 }} className="float">🌍</div>
          <h1 style={{ color: 'white', fontSize: 34, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.25 }}>
            Every trip.<br />Every meal.<br />Every memory.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, margin: '0 0 48px', lineHeight: 1.8 }}>
            Join thousands of groups who use Splitwise to keep track of shared expenses without the awkward money conversations.
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 16, padding: 24,
          }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
              How it works
            </p>
            {[
              { emoji: '1️⃣', text: 'Create a group with your friends' },
              { emoji: '2️⃣', text: 'Add expenses as you spend' },
              { emoji: '3️⃣', text: 'See who owes what instantly' },
              { emoji: '4️⃣', text: 'Settle up with one tap' },
            ].map((step) => (
              <div key={step.emoji} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{step.emoji}</span>
                <span style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>{step.text}</span>
              </div>
            ))}
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
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 6px' }}>Create your account 🎉</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 15, margin: 0 }}>Free forever. No credit card needed.</p>
          </div>

          {error && (
            <div style={{
              background: '#fdecea', border: '1px solid #f5c6c2',
              borderRadius: 10, padding: '13px 16px', marginBottom: 22,
              fontSize: 14, color: '#c0392b',
            }}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="label">Full name</label>
              <input className="input" type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Akash Sharma" required />
            </div>
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
                placeholder="At least 6 characters" required minLength={6} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', padding: '14px 20px', fontSize: 15, borderRadius: 12, marginTop: 6 }}>
              {loading ? '⏳ Creating account...' : 'Create free account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-2)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
            By creating an account you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
