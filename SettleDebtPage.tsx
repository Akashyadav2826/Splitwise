import { useState, type FormEvent, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { type Group } from '../types';
import Navbar from '../components/Navbar';

export default function SettleDebtPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [payerId, setPayerId] = useState(searchParams.get('payerId') || '');
  const [payeeId, setPayeeId] = useState(searchParams.get('payeeId') || '');
  const [amount, setAmount] = useState(searchParams.get('amount') || '');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/groups/${groupId}`).then((r) => setGroup(r.data));
  }, [groupId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/groups/${groupId}/settlements`, {
        payerId: parseInt(payerId),
        payeeId: parseInt(payeeId),
        amount: parseFloat(amount),
      });
      navigate(`/groups/${groupId}`);
    } catch {
      setError('Failed to record settlement');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto p-6">
        <button onClick={() => navigate(`/groups/${groupId}`)} className="text-sm text-teal-600 hover:underline mb-4 block">← Back</button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Record Settlement</h2>
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payer</label>
            <select value={payerId} onChange={(e) => setPayerId(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Select payer</option>
              {(group?.members || []).map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payee (receiving money)</label>
            <select value={payeeId} onChange={(e) => setPayeeId(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Select payee</option>
              {(group?.members || []).map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <button type="submit"
            className="w-full bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700">
            Record Payment
          </button>
        </form>
      </div>
    </div>
  );
}
