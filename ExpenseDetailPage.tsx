import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { type Expense, type ChatMessage } from '../types';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

export default function ExpenseDetailPage() {
  const { id: groupId, expenseId } = useParams<{ id: string; expenseId: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
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
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return () => {
      socket.emit('leave_expense', { expenseId: parseInt(expenseId) });
      socket.off('new_message');
    };
  }, [socket, token, expenseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await api.post(`/expenses/${expenseId}/chats`, { message: newMessage });
    setNewMessage('');
  }

  async function deleteExpense() {
    if (!confirm('Delete this expense?')) return;
    await api.delete(`/groups/${groupId}/expenses/${expenseId}`);
    navigate(`/groups/${groupId}`);
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-6 text-gray-400">Loading…</div></div>;
  if (!expense) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-6">Not found</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={() => navigate(`/groups/${groupId}`)} className="text-sm text-teal-600 hover:underline mb-4 block">← Back to group</button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="bg-white rounded-xl shadow p-5 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{expense.description}</h2>
                  <p className="text-sm text-gray-500 mt-1">Paid by {expense.paid_by_name}</p>
                  <p className="text-xs text-gray-400 capitalize">{expense.split_type} split</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-teal-700">₹{parseFloat(expense.amount).toFixed(2)}</p>
                  <button onClick={deleteExpense} className="text-xs text-red-500 hover:text-red-700 mt-1">Delete</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-semibold text-gray-700 mb-3">Splits</h3>
              <div className="space-y-2">
                {(expense.splits || []).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className={s.user_id === expense.paid_by_user_id ? 'text-teal-600 font-medium' : 'text-gray-700'}>
                      {s.user_name} {s.user_id === expense.paid_by_user_id && '(paid)'}
                    </span>
                    <span className="font-medium">₹{parseFloat(s.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow flex flex-col h-[500px]">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-700">Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-sm text-gray-400 text-center mt-8">No messages yet. Start the conversation!</p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.user_id === user?.id ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-gray-400 mb-1">{m.user_name}</span>
                  <div className={`px-3 py-2 rounded-xl text-sm max-w-xs ${m.user_id === user?.id ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {m.message}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700">Send</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
