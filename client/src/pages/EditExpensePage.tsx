import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { type User } from '../types';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/Toast';

type SplitType = 'equal' | 'exact' | 'percentage' | 'share';
interface MemberSplit { userId: number; userName: string; value: number; }

export default function EditExpensePage() {
  const { id: groupId, expenseId } = useParams<{ id: string; expenseId: string }>();
  const [members, setMembers] = useState<User[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<number | ''>('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [splits, setSplits] = useState<MemberSplit[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [groupRes, expRes] = await Promise.all([
          api.get(`/groups/${groupId}`),
          api.get(`/groups/${groupId}/expenses/${expenseId}`),
        ]);
        const mems: User[] = groupRes.data.members;
        const exp = expRes.data;
        setMembers(mems);
        setDescription(exp.description);
        setAmount(exp.amount);
        setPaidBy(exp.paid_by_user_id);
        setSplitType(exp.split_type);
        setSplits(exp.splits.map((s: { user_id: number; user_name: string; amount: string }) => ({
          userId: s.user_id,
          userName: s.user_name,
          value: exp.split_type === 'equal' ? 1 :
                 exp.split_type === 'share' ? 1 :
                 exp.split_type === 'percentage' ? (parseFloat(s.amount) / parseFloat(exp.amount)) * 100 :
                 parseFloat(s.amount),
        })));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId, expenseId, user]);

  function updateSplitValue(userId: number, value: number) {
    setSplits(prev => prev.map(s => s.userId === userId ? { ...s, value } : s));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/groups/${groupId}/expenses/${expenseId}`, {
        paidByUserId: paidBy,
        amount: parseFloat(amount),
        description,
        splitType,
        members: splits.map(s => ({ userId: s.userId, value: s.value })),
      });
      showToast('Expense updated successfully!');
      navigate(`/groups/${groupId}/expenses/${expenseId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update expense';
      setError(msg);
    }
  }

  const totalSplitAmount = splits.reduce((acc, s) => acc + (s.value || 0), 0);
  const amountNum = parseFloat(amount) || 0;

  const splitTypes = [
    { key: 'equal' as SplitType, emoji: '⚖️', label: 'Equal', desc: 'Split evenly' },
    { key: 'exact' as SplitType, emoji: '🎯', label: 'Exact', desc: 'Custom amounts' },
    { key: 'percentage' as SplitType, emoji: '📊', label: 'Percentage', desc: 'By % share' },
    { key: 'share' as SplitType, emoji: '🔢', label: 'Shares', desc: 'By ratio' },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-3)' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div><p>Loading expense...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', position: 'relative' }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse at 85% 15%, rgba(0,168,150,0.08) 0%, transparent 45%),
          radial-gradient(ellipse at 15% 85%, rgba(0,122,110,0.06) 0%, transparent 45%)`,
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <div style={{
          background: 'linear-gradient(135deg, #1a3a40 0%, #0d2a30 100%)',
          padding: '28px 0 60px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(0,168,150,0.1)' }} />
          <div className="page-container" style={{ paddingTop: 0, paddingBottom: 0, maxWidth: 640, position: 'relative', zIndex: 1 }}>
            <button onClick={() => navigate(`/groups/${groupId}/expenses/${expenseId}`)} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.8)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16,
              display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
            }}>← Back</button>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px', color: 'white' }}>Edit expense ✏️</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>Update the details of this expense</p>
          </div>
        </div>

        <div className="page-container" style={{ marginTop: -32, maxWidth: 640, position: 'relative', zIndex: 2 }}>
          {error && (
            <div style={{
              background: '#fdecea', border: '1px solid #f5c6c2', borderRadius: 10,
              padding: '13px 16px', marginBottom: 16, fontSize: 14, color: '#c0392b',
            }}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label className="label">What was this expense for?</label>
                  <input className="input" type="text" value={description}
                    onChange={(e) => setDescription(e.target.value)} required
                    placeholder="e.g. Dinner at Pizza Hut" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label">Total amount (Rs.)</label>
                    <input className="input" type="number" step="0.01" min="0.01"
                      value={amount} onChange={(e) => setAmount(e.target.value)} required
                      placeholder="0.00" style={{ fontSize: 20, fontWeight: 700 }} />
                  </div>
                  <div>
                    <label className="label">Paid by</label>
                    <select className="input" value={paidBy}
                      onChange={(e) => setPaidBy(parseInt(e.target.value))} required>
                      <option value="">Select member</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid var(--border)' }}>
              <label className="label" style={{ marginBottom: 14, fontSize: 14 }}>How to split?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
                {splitTypes.map(({ key, emoji, label, desc }) => (
                  <button key={key} type="button" onClick={() => setSplitType(key)} style={{
                    padding: '14px 8px', borderRadius: 12, border: '2px solid',
                    borderColor: splitType === key ? 'var(--brand)' : 'var(--border)',
                    background: splitType === key ? 'var(--brand-light)' : 'var(--surface-2)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    fontFamily: 'inherit',
                  }}>
                    <span style={{ fontSize: 22 }}>{emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: splitType === key ? 'var(--brand-dark)' : 'var(--text-1)' }}>{label}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{desc}</span>
                  </button>
                ))}
              </div>

              {splitType === 'equal' ? (
                <div style={{
                  background: 'var(--brand-light)', borderRadius: 12, padding: '14px 18px',
                  border: '1px solid #b2ede8', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 20 }}>⚖️</span>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--brand-dark)', fontWeight: 500 }}>
                    Split equally among {members.length} members
                    {amountNum > 0 && <strong> — Rs.{(amountNum / members.length).toFixed(2)} each</strong>}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                    {splitType === 'percentage' ? `Total: ${totalSplitAmount.toFixed(1)}% ${Math.abs(totalSplitAmount - 100) < 0.01 ? '✅' : '⚠️'}` :
                     splitType === 'exact' ? `Total: Rs.${totalSplitAmount.toFixed(2)} ${amountNum > 0 && Math.abs(totalSplitAmount - amountNum) < 0.01 ? '✅' : amountNum > 0 ? '⚠️' : ''}` :
                     `Total shares: ${totalSplitAmount}`}
                  </p>
                  {splits.map((s) => (
                    <div key={s.userId} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: 'var(--surface-2)', borderRadius: 10, padding: '10px 14px',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--brand)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 13, flexShrink: 0,
                      }}>{s.userName.charAt(0).toUpperCase()}</div>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{s.userName}</span>
                      <input type="number" step={splitType === 'share' ? '1' : '0.01'} min="0"
                        value={s.value || ''}
                        onChange={(e) => updateSplitValue(s.userId, parseFloat(e.target.value) || 0)}
                        style={{
                          width: 110, border: '1.5px solid var(--border)', borderRadius: 8,
                          padding: '8px 12px', fontSize: 15, fontWeight: 700,
                          textAlign: 'right', outline: 'none', fontFamily: 'inherit', background: 'white',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
                      <span style={{ fontSize: 12, color: 'var(--text-3)', width: 18, textAlign: 'center' }}>
                        {splitType === 'percentage' ? '%' : splitType === 'share' ? '×' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary"
              style={{ width: '100%', padding: '15px 20px', fontSize: 15, borderRadius: 14 }}>
              ✓ Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
