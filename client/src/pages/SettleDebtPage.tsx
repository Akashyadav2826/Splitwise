import { useState, type FormEvent, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { type Group } from '../types';
import Navbar from '../components/Navbar';
import { showToast } from '../components/Toast';

export default function SettleDebtPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [payerId, setPayerId] = useState(searchParams.get('payerId') || '');
  const [payeeId, setPayeeId] = useState(searchParams.get('payeeId') || '');
  const [amount, setAmount] = useState(searchParams.get('amount') || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { api.get(`/groups/${groupId}`).then((r) => setGroup(r.data)); }, [groupId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError('');
    try {
      await api.post(`/groups/${groupId}/settlements`, {
        payerId: parseInt(payerId), payeeId: parseInt(payeeId), amount: parseFloat(amount),
      });
      setSuccess(true);
      showToast('Settlement recorded successfully! 🤝');
      setTimeout(() => navigate(`/groups/${groupId}`), 1800);
    } catch { setError('Failed to record settlement. Please try again.'); }
  }

  const payer = group?.members?.find(m => m.id === parseInt(payerId));
  const payee = group?.members?.find(m => m.id === parseInt(payeeId));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', position: 'relative' }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse at 70% 20%, rgba(0,168,150,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 20% 80%, rgba(0,122,110,0.06) 0%, transparent 50%)`,
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <div style={{
          background: 'linear-gradient(135deg, #1a3a40 0%, #0a2530 100%)',
          padding: '28px 0 60px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, left: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(0,168,150,0.1)' }} />
          <div className="page-container" style={{ paddingTop: 0, paddingBottom: 0, maxWidth: 560, position: 'relative', zIndex: 1 }}>
            <button onClick={() => navigate(`/groups/${groupId}`)} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.8)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16,
              display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
            }}>← Back to group</button>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px', color: 'white' }}>Settle up 🤝</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>Record a payment between group members</p>
          </div>
        </div>

        <div className="page-container" style={{ marginTop: -28, maxWidth: 560, position: 'relative', zIndex: 2 }}>
          {success && (
            <div style={{
              background: 'linear-gradient(135deg, #e6f7f2, #d0f0e8)',
              border: '1px solid #b2ede8', borderRadius: 14,
              padding: '20px 24px', marginBottom: 20, textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0,168,150,0.15)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
              <p style={{ fontSize: 16, color: '#0a7c5c', fontWeight: 700, margin: '0 0 4px' }}>Settlement recorded!</p>
              <p style={{ fontSize: 13, color: '#2a9d8f', margin: 0 }}>Redirecting back to group...</p>
            </div>
          )}
          {error && (
            <div style={{ background: '#fdecea', border: '1px solid #f5c6c2', borderRadius: 10, padding: '13px 16px', marginBottom: 16, fontSize: 14, color: '#c0392b' }}>
              ⚠️ {error}
            </div>
          )}
          {payer && payee && amount && (
            <div style={{
              background: 'white', borderRadius: 14, padding: '18px 24px', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
              boxShadow: '0 4px 16px rgba(0,0,0,0.07)', border: '1px solid var(--border)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fdecea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, margin: '0 auto 6px', color: '#c0392b' }}>{payer.name.charAt(0).toUpperCase()}</div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{payer.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)' }}>paying</p>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', margin: '0 0 2px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Rs.{parseFloat(amount).toFixed(2)}</p>
                <div style={{ height: 2, background: 'linear-gradient(90deg, #fdecea, var(--brand), #e6f7f2)', borderRadius: 999 }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e6f7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, margin: '0 auto 6px', color: '#0a7c5c' }}>{payee.name.charAt(0).toUpperCase()}</div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{payee.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)' }}>receiving</p>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ background: 'white', borderRadius: 16, padding: 28, marginBottom: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label className="label">Who is paying?</label>
                  <select className="input" value={payerId} onChange={(e) => setPayerId(e.target.value)} required>
                    <option value="">Select payer</option>
                    {(group?.members || []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Who is receiving the money?</label>
                  <select className="input" value={payeeId} onChange={(e) => setPayeeId(e.target.value)} required>
                    <option value="">Select recipient</option>
                    {(group?.members || []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Amount (Rs.)</label>
                  <input className="input" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" style={{ fontSize: 20, fontWeight: 700 }} />
                </div>
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '15px 20px', fontSize: 15, borderRadius: 14 }}>
              ✓ Record Payment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
