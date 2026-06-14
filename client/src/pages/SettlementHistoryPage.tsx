import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { type Settlement } from '../types';
import Navbar from '../components/Navbar';
import { SkeletonList } from '../components/Skeleton';

export default function SettlementHistoryPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [sRes, gRes] = await Promise.all([
          api.get(`/groups/${groupId}/settlements`),
          api.get(`/groups/${groupId}`),
        ]);
        setSettlements(sRes.data);
        setGroupName(gRes.data.name);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

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
          background: 'linear-gradient(135deg, #0d2a30 0%, #1a4048 100%)',
          padding: '28px 0 60px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: 80, width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,168,150,0.1)' }} />
          <div className="page-container" style={{ paddingTop: 0, paddingBottom: 0, position: 'relative', zIndex: 1 }}>
            <button onClick={() => navigate(`/groups/${groupId}`)} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.8)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16,
              display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
            }}>← Back to group</button>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px', color: 'white' }}>Settlement History 🤝</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{groupName} · All recorded payments</p>
          </div>
        </div>

        <div className="page-container" style={{ marginTop: -36, position: 'relative', zIndex: 2 }}>
          {loading ? (
            <SkeletonList count={4} />
          ) : settlements.length === 0 ? (
            <div style={{
              background: 'white', borderRadius: 20, padding: 60, textAlign: 'center',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <h3 style={{ margin: '0 0 8px', color: 'var(--text-1)', fontSize: 18 }}>No settlements yet</h3>
              <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 14 }}>Settlements will appear here once members start paying each other</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>
                  {settlements.length} payment{settlements.length !== 1 ? 's' : ''} recorded
                </h3>
                <span style={{
                  background: 'white', border: '1px solid var(--border)',
                  borderRadius: 999, padding: '4px 14px', fontSize: 13,
                  color: 'var(--brand)', fontWeight: 700,
                }}>
                  Total: Rs.{settlements.reduce((sum, s) => sum + parseFloat(s.amount), 0).toFixed(2)}
                </span>
              </div>
              {settlements.map((s) => (
                <div key={s.id} style={{
                  background: 'white', borderRadius: 16, padding: '18px 24px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'linear-gradient(135deg, #e6f7f2, #b2ede8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                    }}>🤝</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 14, fontWeight: 700, color: 'var(--text-1)',
                          background: '#fdecea', padding: '2px 10px', borderRadius: 999,
                        }}>{s.payer_name}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-3)' }}>paid</span>
                        <span style={{
                          fontSize: 14, fontWeight: 700, color: 'var(--text-1)',
                          background: '#e6f7f2', padding: '2px 10px', borderRadius: 999,
                        }}>{s.payee_name}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>
                        📅 {formatDate(s.created_at)}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    fontSize: 20, fontWeight: 800,
                    color: '#0a7c5c', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}>
                    Rs.{parseFloat(s.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
