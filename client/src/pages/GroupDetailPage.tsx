import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { type Group, type Expense, type BalanceEntry, type User } from '../types';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { SkeletonList } from '../components/Skeleton';
import { showToast } from '../components/Toast';
import { getCategoryIcon } from '../utils/categoryEmoji';

type Tab = 'expenses' | 'balances' | 'members';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<BalanceEntry[]>([]);
  const [chatCounts, setChatCounts] = useState<Record<number, number>>({});
  const [tab, setTab] = useState<Tab>('expenses');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [groupRes, expRes, balRes] = await Promise.all([
          api.get(`/groups/${id}`),
          api.get(`/groups/${id}/expenses`),
          api.get(`/groups/${id}/balances`),
        ]);
        setGroup(groupRes.data);
        setExpenses(expRes.data);
        setBalances(balRes.data);
        const counts: Record<number, number> = {};
        await Promise.all(expRes.data.map(async (e: Expense) => {
          try {
            const chatRes = await api.get(`/expenses/${e.id}/chats`);
            counts[e.id] = chatRes.data.length;
          } catch { counts[e.id] = 0; }
        }));
        setChatCounts(counts);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSearchMember() {
    if (search.trim().length < 2) return;
    const res = await api.get(`/users/search?q=${encodeURIComponent(search)}`);
    setSearchResults(res.data);
  }

  async function addMember(userId: number) {
    await api.post(`/groups/${id}/members`, { userId });
    const res = await api.get(`/groups/${id}`);
    setGroup(res.data);
    setSearch('');
    setSearchResults([]);
    showToast('Member added successfully!');
  }

  async function removeMember(userId: number) {
    await api.delete(`/groups/${id}/members/${userId}`);
    const res = await api.get(`/groups/${id}`);
    setGroup(res.data);
    showToast('Member removed', 'info');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      <Navbar />
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '80px 24px' }}>
        <SkeletonList count={4} />
      </div>
    </div>
  );

  if (!group) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      <Navbar /><div style={{ textAlign: 'center', padding: 80 }}>Group not found</div>
    </div>
  );

  const myBalance = balances.find((b) => b.userId === user?.id);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', position: 'relative' }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse at 80% 10%, rgba(0,168,150,0.07) 0%, transparent 50%),
          radial-gradient(ellipse at 10% 90%, rgba(0,122,110,0.05) 0%, transparent 50%)`,
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <div style={{
          background: 'linear-gradient(135deg, #0d1f22 0%, #1a3a40 100%)',
          padding: '32px 0 72px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,168,150,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -60, left: '40%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(0,168,150,0.07)' }} />
          <div className="page-container" style={{ paddingTop: 0, paddingBottom: 0, position: 'relative', zIndex: 1 }}>
            <button onClick={() => navigate('/dashboard')} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.8)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 20,
              display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
            }}>← Dashboard</button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, boxShadow: '0 4px 16px rgba(0,168,150,0.4)',
                }}>🏷️</div>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: 'white' }}>{group.name}</h2>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>👥 {group.members?.length || 0} members</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => navigate(`/groups/${id}/settlements`)} style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 10, padding: '10px 16px', color: 'white', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>🤝 History</button>
                <Link to={`/groups/${id}/expenses/new`} style={{ textDecoration: 'none' }}>
                  <button style={{
                    background: 'var(--brand)', border: 'none', borderRadius: 12,
                    padding: '11px 20px', color: 'white', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 4px 16px rgba(0,168,150,0.5)', fontFamily: 'inherit',
                  }}>
                    <span style={{ fontSize: 18 }}>+</span> Add Expense
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="page-container" style={{ marginTop: -40, position: 'relative', zIndex: 2 }}>
          {myBalance && (myBalance.owes.length > 0 || myBalance.owedBy.length > 0) && (
            <div style={{
              background: 'white', borderRadius: 14, padding: '14px 20px', marginBottom: 20,
              display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your balance</span>
              {myBalance.owes.map((o) => (
                <span key={o.userId} className="badge-red">You owe {o.userName} Rs.{o.amount.toFixed(2)}</span>
              ))}
              {myBalance.owedBy.map((o) => (
                <span key={o.userId} className="badge-green">{o.userName} owes you Rs.{o.amount.toFixed(2)}</span>
              ))}
            </div>
          )}

          <div style={{
            background: 'white', borderRadius: 14, marginBottom: 20,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {(['expenses', 'balances', 'members'] as Tab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                  padding: '16px 20px', fontSize: 14, fontWeight: 600,
                  borderBottom: tab === t ? '2.5px solid var(--brand)' : '2.5px solid transparent',
                  color: tab === t ? 'var(--brand)' : 'var(--text-2)',
                  marginBottom: -1, transition: 'all 0.15s', fontFamily: 'inherit',
                }}>
                  {t === 'expenses' ? '💸 Expenses' : t === 'balances' ? '⚖️ Balances' : '👥 Members'}
                </button>
              ))}
            </div>

            <div style={{ padding: 20 }}>
              {tab === 'expenses' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {expenses.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
                      <h3 style={{ margin: '0 0 8px', color: 'var(--text-1)' }}>No expenses yet</h3>
                      <p style={{ margin: '0 0 20px', color: 'var(--text-2)', fontSize: 14 }}>Add your first expense to start tracking</p>
                      <Link to={`/groups/${id}/expenses/new`} style={{ textDecoration: 'none' }}>
                        <button className="btn-primary">Add first expense</button>
                      </Link>
                    </div>
                  ) : expenses.map((e) => (
                    <Link key={e.id} to={`/groups/${id}/expenses/${e.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: 'var(--surface-2)', borderRadius: 12, padding: '14px 18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', transition: 'all 0.2s', border: '1px solid transparent',
                      }}
                      onMouseEnter={ev => { (ev.currentTarget as HTMLDivElement).style.background = 'var(--brand-light)'; (ev.currentTarget as HTMLDivElement).style.borderColor = '#b2ede8'; }}
                      onMouseLeave={ev => { (ev.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)'; (ev.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: 'white', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 20,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          }}>{getCategoryIcon(e.description)}</div>
                          <div>
                            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>{e.description}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Paid by {e.paid_by_name}</span>
                              <span className="split-pill">{e.split_type}</span>
                              {chatCounts[e.id] > 0 && (
                                <span style={{
                                  fontSize: 11, color: 'var(--brand)', fontWeight: 700,
                                  background: 'var(--brand-light)', padding: '2px 8px', borderRadius: 999,
                                  display: 'flex', alignItems: 'center', gap: 3,
                                }}>💬 {chatCounts[e.id]}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: 'var(--text-1)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Rs.{parseFloat(e.amount).toFixed(2)}
                          </p>
                          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--brand)', fontWeight: 600 }}>View →</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {tab === 'balances' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {balances.filter((b) => b.owes.length > 0 || b.owedBy.length > 0).length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                      <h3 style={{ margin: '0 0 8px', color: 'var(--text-1)' }}>All settled up!</h3>
                      <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 14 }}>Everyone is even in this group</p>
                    </div>
                  ) : balances.filter(b => b.owes.length > 0 || b.owedBy.length > 0).map((b) => (
                    <div key={b.userId} style={{
                      background: 'var(--surface-2)', borderRadius: 12, padding: '16px 20px',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: b.userId === user?.id ? 'var(--brand)' : 'linear-gradient(135deg, var(--brand-light), #b2ede8)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: b.userId === user?.id ? 'white' : 'var(--brand-dark)', fontWeight: 700, fontSize: 13,
                        }}>{b.userName.charAt(0).toUpperCase()}</div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>
                          {b.userName} {b.userId === user?.id && <span style={{ fontSize: 11, color: 'var(--brand)' }}>(you)</span>}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 44 }}>
                        {b.owes.map((o) => (
                          <div key={o.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 14, color: 'var(--text-2)' }}>owes <strong>{o.userName}</strong></span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span className="badge-red">Rs.{o.amount.toFixed(2)}</span>
                              {b.userId === user?.id && (
                                <Link to={`/groups/${id}/settle?payerId=${b.userId}&payeeId=${o.userId}&amount=${o.amount}`} style={{ textDecoration: 'none' }}>
                                  <button className="btn-primary" style={{ padding: '5px 14px', fontSize: 12, borderRadius: 6, boxShadow: 'none' }}>
                                    Settle up
                                  </button>
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                        {b.owedBy.map((o) => (
                          <div key={o.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 14, color: 'var(--text-2)' }}>owed by <strong>{o.userName}</strong></span>
                            <span className="badge-green">Rs.{o.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'members' && (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                    {(group.members || []).map((m) => (
                      <div key={m.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', borderRadius: 12,
                        background: m.id === user?.id ? 'var(--brand-light)' : 'var(--surface-2)',
                        border: m.id === user?.id ? '1px solid #b2ede8' : '1px solid transparent',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: m.id === user?.id ? 'var(--brand)' : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: m.id === user?.id ? 'white' : 'var(--text-2)',
                            fontWeight: 700, fontSize: 15, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          }}>{m.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              {m.name}
                              {m.id === user?.id && <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 700, background: 'var(--brand-light)', padding: '2px 8px', borderRadius: 999 }}>you</span>}
                              {m.id === group.created_by && <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>admin</span>}
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>{m.email}</p>
                          </div>
                        </div>
                        {group.created_by === user?.id && m.id !== user?.id && (
                          <button onClick={() => removeMember(m.id)} style={{
                            background: '#fdecea', border: '1px solid #f5c6c2',
                            borderRadius: 8, padding: '6px 14px', fontSize: 12,
                            color: '#c0392b', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          }}>Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 12px' }}>➕ Add a member</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="input" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email" />
                      <button onClick={handleSearchMember} className="btn-secondary" style={{ whiteSpace: 'nowrap', padding: '11px 18px' }}>Search</button>
                    </div>
                    {searchResults.length > 0 && (
                      <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                        {searchResults.map((u) => (
                          <button key={u.id} onClick={() => addMember(u.id)} style={{
                            width: '100%', textAlign: 'left', padding: '12px 16px',
                            background: 'white', border: 'none', borderBottom: '1px solid var(--border)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                            <span style={{ fontSize: 14, color: 'var(--text-1)', fontWeight: 500 }}>
                              {u.name} <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{u.email}</span>
                            </span>
                            <span style={{ color: 'var(--brand)', fontWeight: 600, fontSize: 13 }}>+ Add</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
