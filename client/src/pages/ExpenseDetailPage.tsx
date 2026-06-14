import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { type Expense, type ChatMessage } from '../types';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { showToast } from '../components/Toast';
import { getCategoryIcon } from '../utils/categoryEmoji';

export default function ExpenseDetailPage() {
  const { id: groupId, expenseId } = useParams<{ id: string; expenseId: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user, token } = useAuth();
  const socket = useSocket();
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [expRes, chatRes] = await Promise.all([
          api.get(`/groups/${groupId}/expenses/${expenseId}`),
          api.get(`/expenses/${expenseId}/chats`),
        ]);
        setExpense(expRes.data);
        setMessages(chatRes.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId, expenseId]);

  useEffect(() => {
    if (!socket || !token || !expenseId) return;
    socket.emit('join_expense', { expenseId: parseInt(expenseId), token });
    socket.on('new_message', (msg: ChatMessage) => {
      setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
    });
    return () => {
      socket.emit('leave_expense', { expenseId: parseInt(expenseId) });
      socket.off('new_message');
    };
  }, [socket, token, expenseId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await api.post(`/expenses/${expenseId}/chats`, { message: newMessage });
    setNewMessage('');
  }

  async function handleDelete() {
    await api.delete(`/groups/${groupId}/expenses/${expenseId}`);
    showToast('Expense deleted', 'error');
    navigate(`/groups/${groupId}`);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-3)' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div><p>Loading...</p>
      </div>
    </div>
  );

  if (!expense) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      <Navbar /><div style={{ textAlign: 'center', padding: 80 }}>Not found</div>
    </div>
  );

  const categoryIcon = getCategoryIcon(expense.description);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', position: 'relative' }}>
      {showDeleteModal && (
        <ConfirmModal
          title="Delete Expense"
          message={`Are you sure you want to delete "${expense.description}"? This will remove all splits and cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse at 20% 20%, rgba(0,168,150,0.07) 0%, transparent 45%),
          radial-gradient(ellipse at 80% 80%, rgba(0,122,110,0.05) 0%, transparent 45%)`,
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <div style={{
          background: 'linear-gradient(135deg, #0d2a30 0%, #1a4048 100%)',
          padding: '28px 0 64px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: 100, width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,168,150,0.1)' }} />
          <div className="page-container" style={{ paddingTop: 0, paddingBottom: 0, position: 'relative', zIndex: 1 }}>
            <button onClick={() => navigate(`/groups/${groupId}`)} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.8)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 20,
              display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
            }}>← Back to group</button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, boxShadow: '0 4px 16px rgba(0,168,150,0.4)',
                }}>{categoryIcon}</div>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: 'white' }}>{expense.description}</h2>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                    Paid by {expense.paid_by_name} · <span style={{ textTransform: 'capitalize' }}>{expense.split_type}</span> split
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: '0 0 8px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Rs.{parseFloat(expense.amount).toFixed(2)}
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => navigate(`/groups/${groupId}/expenses/${expenseId}/edit`)} style={{
                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 8, padding: '6px 14px', fontSize: 12,
                    color: 'white', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>✏️ Edit</button>
                  <button onClick={() => setShowDeleteModal(true)} style={{
                    background: 'rgba(230,57,70,0.2)', border: '1px solid rgba(230,57,70,0.4)',
                    borderRadius: 8, padding: '6px 14px', fontSize: 12,
                    color: '#ff8a8a', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>🗑 Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-container" style={{ marginTop: -36, position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                💰 Split breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(expense.splits || []).map((s) => (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: 12,
                    background: s.user_id === expense.paid_by_user_id ? 'var(--brand-light)' : 'var(--surface-2)',
                    border: s.user_id === expense.paid_by_user_id ? '1px solid #b2ede8' : '1px solid transparent',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: s.user_id === expense.paid_by_user_id ? 'var(--brand)' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: s.user_id === expense.paid_by_user_id ? 'white' : 'var(--text-2)',
                        fontWeight: 700, fontSize: 13, boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      }}>{s.user_name.charAt(0).toUpperCase()}</div>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{s.user_name}</span>
                        {s.user_id === expense.paid_by_user_id && (
                          <span style={{ fontSize: 10, color: 'var(--brand)', marginLeft: 6, fontWeight: 700, background: '#b2ede8', padding: '2px 6px', borderRadius: 999 }}>PAID</span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      Rs.{parseFloat(s.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: 'white', borderRadius: 16,
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', height: 520,
            }}>
              <div style={{
                padding: '18px 24px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'linear-gradient(135deg, #f8fafb, #edf7f5)',
                borderRadius: '16px 16px 0 0',
              }}>
                <span style={{ fontSize: 20 }}>💬</span>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Group chat</h3>
                <span style={{
                  fontSize: 11, color: 'var(--brand)', marginLeft: 'auto',
                  background: 'var(--brand-light)', padding: '3px 10px', borderRadius: 999, fontWeight: 700,
                }}>{messages.length} msgs</span>
              </div>

              <div style={{
                flex: 1, overflowY: 'auto', padding: '20px',
                display: 'flex', flexDirection: 'column', gap: 14,
                background: `radial-gradient(ellipse at 50% 0%, rgba(0,168,150,0.03) 0%, transparent 60%)`,
              }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-3)' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>No messages yet</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12 }}>Start the conversation!</p>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: m.user_id === user?.id ? 'flex-end' : 'flex-start',
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 600 }}>{m.user_name}</span>
                    <div style={{
                      padding: '10px 16px',
                      borderRadius: m.user_id === user?.id ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: m.user_id === user?.id
                        ? 'linear-gradient(135deg, var(--brand), var(--brand-dark))'
                        : 'var(--surface-2)',
                      color: m.user_id === user?.id ? 'white' : 'var(--text-1)',
                      fontSize: 14, maxWidth: '78%', lineHeight: 1.5,
                      boxShadow: m.user_id === user?.id ? '0 3px 12px rgba(0,168,150,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                      border: m.user_id === user?.id ? 'none' : '1px solid var(--border)',
                    }}>
                      {m.message}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={sendMessage} style={{
                padding: '14px 20px', borderTop: '1px solid var(--border)',
                display: 'flex', gap: 10, background: '#fafbfc', borderRadius: '0 0 16px 16px',
              }}>
                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input" style={{ flex: 1, borderRadius: 999 }} />
                <button type="submit" className="btn-primary" style={{ padding: '10px 20px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                  Send →
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
