import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { type Group, type BalanceEntry } from '../types';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { SkeletonList } from '../components/Skeleton';

export default function DashboardPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [balances, setBalances] = useState<BalanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [groupsRes, meRes] = await Promise.all([api.get('/groups'), api.get('/users/me')]);
        setGroups(groupsRes.data);
        const summary = meRes.data.balanceSummary as { owes: BalanceEntry['owes']; owedBy: BalanceEntry['owedBy'] }[];
        setBalances(summary.map((s, i) => ({ userId: i, userName: '', owes: s.owes, owedBy: s.owedBy })));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalOwed = balances.flatMap((b) => b.owedBy).reduce((sum, x) => sum + x.amount, 0);
  const totalOwes = balances.flatMap((b) => b.owes).reduce((sum, x) => sum + x.amount, 0);
  const netBalance = totalOwed - totalOwes;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: `
          radial-gradient(ellipse at 10% 20%, rgba(0,168,150,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 90% 80%, rgba(0,122,110,0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(0,168,150,0.03) 0%, transparent 70%)
        `,
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <div style={{
          background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
          padding: '40px 0 80px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', bottom: -80, left: '30%', width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div className="page-container" style={{ paddingBottom: 0, paddingTop: 0, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: '0 0 6px', fontWeight: 500 }}>Welcome back,</p>
                <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 4px', color: 'white' }}>{user?.name} 👋</h2>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: 0 }}>Here is your expense overview</p>
              </div>
              <button onClick={() => navigate('/groups/new')} style={{
                background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(10px)', color: 'white', borderRadius: 12,
                padding: '12px 22px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}>
                <span style={{ fontSize: 18 }}>+</span> New Group
              </button>
            </div>
          </div>
        </div>

        <div className="page-container" style={{ marginTop: -48, position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
            {loading ? (
              <>
                {[1,2,3].map(i => (
                  <div key={i} style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid var(--border)', height: 96 }}>
                    <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 12, borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 28, width: '80%', borderRadius: 6 }} />
                  </div>
                ))}
              </>
            ) : (
              <>
                {[
                  { label: 'You are owed', value: totalOwed, color: '#0a7c5c', emoji: '📈' },
                  { label: 'You owe', value: totalOwes, color: '#c0392b', emoji: '📉' },
                  { label: 'Net balance', value: Math.abs(netBalance), color: netBalance >= 0 ? '#0a7c5c' : '#c0392b', emoji: netBalance >= 0 ? '✅' : '⚠️', prefix: netBalance >= 0 ? '+' : '-' },
                ].map((card) => (
                  <div key={card.label} style={{
                    background: 'white', borderRadius: 16, padding: 24,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid var(--border)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{card.label}</p>
                      <span style={{ fontSize: 20 }}>{card.emoji}</span>
                    </div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: card.color, margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      {('prefix' in card ? card.prefix : '')}Rs.{card.value.toFixed(2)}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>Your Groups</h3>
            <span style={{ fontSize: 13, color: 'var(--text-3)', background: 'white', padding: '4px 12px', borderRadius: 999, border: '1px solid var(--border)' }}>
              {groups.length} group{groups.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <SkeletonList count={3} />
          ) : groups.length === 0 ? (
            <div style={{
              background: 'white', borderRadius: 20, padding: 60, textAlign: 'center',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🏖️</div>
              <h3 style={{ margin: '0 0 8px', color: 'var(--text-1)', fontSize: 20 }}>No groups yet</h3>
              <p style={{ margin: '0 0 24px', color: 'var(--text-2)', fontSize: 14 }}>Create a group to start splitting expenses with friends</p>
              <button onClick={() => navigate('/groups/new')} className="btn-primary" style={{ padding: '12px 28px' }}>
                Create your first group
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {groups.map((g, i) => {
                const colors = ['#00a896','#e76f51','#457b9d','#2a9d8f','#e9c46a','#264653'];
                const emojis = ['🏖️','🏠','✈️','🍕','🎉','💼'];
                const color = colors[i % colors.length];
                const emoji = emojis[i % emojis.length];
                return (
                  <Link key={g.id} to={`/groups/${g.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'white', borderRadius: 16, padding: '18px 24px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid var(--border)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 14,
                          background: `linear-gradient(135deg, ${color}22, ${color}44)`,
                          border: `2px solid ${color}33`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                        }}>{emoji}</div>
                        <div>
                          <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>{g.name}</p>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>👥 {g.member_count} member{g.member_count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand)', fontWeight: 700, fontSize: 13 }}>
                        View <span style={{ fontSize: 16 }}>→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
