import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { type User } from '../types';
import Navbar from '../components/Navbar';

export default function CreateGroupPage() {
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  async function handleSearch() {
    if (search.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(search)}`);
      setSearchResults(res.data);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }

  function addMember(user: User) {
    if (!selectedMembers.find((m) => m.id === user.id)) setSelectedMembers((prev) => [...prev, user]);
    setSearch(''); setSearchResults([]);
  }

  function removeMember(id: number) { setSelectedMembers((prev) => prev.filter((m) => m.id !== id)); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError('');
    try {
      const res = await api.post('/groups', { name, memberIds: selectedMembers.map((m) => m.id) });
      navigate(`/groups/${res.data.id}`);
    } catch { setError('Failed to create group. Please try again.'); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', position: 'relative' }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse at 80% 20%, rgba(0,168,150,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 20% 80%, rgba(0,122,110,0.06) 0%, transparent 50%)
        `,
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <div style={{
          background: 'linear-gradient(135deg, #0d2a30 0%, #1a4048 100%)',
          padding: '28px 0 60px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: 80, width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,168,150,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: 100, width: 150, height: 150, borderRadius: '50%', background: 'rgba(0,168,150,0.07)' }} />
          <div className="page-container" style={{ paddingTop: 0, paddingBottom: 0, maxWidth: 600, position: 'relative', zIndex: 1 }}>
            <button onClick={() => navigate('/dashboard')} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.8)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16,
              display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
            }}>← Dashboard</button>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px', color: 'white' }}>Create a group 👥</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>Add friends and start splitting expenses together</p>
          </div>
        </div>

        <div className="page-container" style={{ marginTop: -28, maxWidth: 600, position: 'relative', zIndex: 2 }}>
          {error && (
            <div style={{
              background: '#fdecea', border: '1px solid #f5c6c2', borderRadius: 10,
              padding: '13px 16px', marginBottom: 16, fontSize: 14, color: '#c0392b',
            }}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ background: 'white', borderRadius: 16, padding: 28, marginBottom: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid var(--border)' }}>
              <div style={{ marginBottom: 24 }}>
                <label className="label">Group name</label>
                <input className="input" type="text" value={name}
                  onChange={(e) => setName(e.target.value)} required
                  placeholder="e.g. Thailand Trip, Flat 4B, Weekend Getaway" />
              </div>

              <div>
                <label className="label">Add members</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input" type="text" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                    placeholder="Search by name or email" />
                  <button type="button" onClick={handleSearch} className="btn-secondary"
                    style={{ whiteSpace: 'nowrap', padding: '11px 18px' }}>
                    {searching ? '...' : 'Search'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div style={{
                    marginTop: 8, border: '1px solid var(--border)',
                    borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-md)',
                  }}>
                    {searchResults.map((u) => (
                      <button key={u.id} type="button" onClick={() => addMember(u)} style={{
                        width: '100%', textAlign: 'left', padding: '12px 16px',
                        background: 'white', border: 'none', borderBottom: '1px solid var(--border)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        fontFamily: 'inherit', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--brand-light), #b2ede8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--brand-dark)', fontWeight: 700, fontSize: 14,
                          }}>{u.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{u.name}</p>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>{u.email}</p>
                          </div>
                        </div>
                        <span style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 13 }}>+ Add</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedMembers.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Added ({selectedMembers.length})
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedMembers.map((m) => (
                        <div key={m.id} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: 'var(--brand-light)', borderRadius: 999,
                          padding: '5px 12px 5px 5px', border: '1px solid #b2ede8',
                        }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: 'var(--brand)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700,
                          }}>{m.name.charAt(0).toUpperCase()}</div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-dark)' }}>{m.name}</span>
                          <button type="button" onClick={() => removeMember(m.id)} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--brand-dark)', fontWeight: 700, fontSize: 16,
                            padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center', fontFamily: 'inherit',
                          }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="btn-primary"
              style={{ width: '100%', padding: '15px 20px', fontSize: 15, borderRadius: 14 }}>
              ✓ Create Group
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
