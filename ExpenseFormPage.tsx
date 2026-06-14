import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { type User } from '../types';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

type SplitType = 'equal' | 'exact' | 'percentage' | 'share';

interface MemberSplit {
  userId: number;
  userName: string;
  value: number;
}

export default function ExpenseFormPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const [members, setMembers] = useState<User[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<number | ''>('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [splits, setSplits] = useState<MemberSplit[]>([]);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const res = await api.get(`/groups/${groupId}`);
      const mems: User[] = res.data.members;
      setMembers(mems);
      setSplits(mems.map((m) => ({ userId: m.id, userName: m.name, value: splitType === 'equal' ? 1 : 0 })));
      if (user) setPaidBy(user.id);
    }
    load();
  }, [groupId]);

  useEffect(() => {
    setSplits((prev) => prev.map((s) => ({ ...s, value: splitType === 'share' ? 1 : 0 })));
  }, [splitType]);

  function updateSplitValue(userId: number, value: number) {
    setSplits((prev) => prev.map((s) => (s.userId === userId ? { ...s, value } : s)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        paidByUserId: paidBy,
        amount: parseFloat(amount),
        description,
        splitType,
        members: splits.map((s) => ({ userId: s.userId, value: s.value })),
      };
      await api.post(`/groups/${groupId}/expenses`, payload);
      navigate(`/groups/${groupId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create expense';
      setError(msg);
    }
  }

  const totalSplitAmount = splits.reduce((acc, s) => acc + (s.value || 0), 0);
  const amountNum = parseFloat(amount) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto p-6">
        <button onClick={() => navigate(`/groups/${groupId}`)} className="text-sm text-teal-600 hover:underline mb-4 block">← Back</button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Expense</h2>
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required
              placeholder="e.g. Dinner at Zara"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paid by</label>
            <select value={paidBy} onChange={(e) => setPaidBy(parseInt(e.target.value))} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Select member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Split type</label>
            <div className="grid grid-cols-4 gap-2">
              {(['equal', 'exact', 'percentage', 'share'] as SplitType[]).map((t) => (
                <button key={t} type="button" onClick={() => setSplitType(t)}
                  className={`py-1.5 text-xs rounded-lg border font-medium capitalize ${splitType === t ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 text-gray-600 hover:border-teal-400'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {splitType !== 'equal' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {splitType === 'exact' && 'Exact amounts'}
                {splitType === 'percentage' && `Percentages (total: ${totalSplitAmount}%)`}
                {splitType === 'share' && `Shares (total: ${totalSplitAmount})`}
              </label>
              <div className="space-y-2">
                {splits.map((s) => (
                  <div key={s.userId} className="flex items-center gap-3">
                    <span className="flex-1 text-sm text-gray-700">{s.userName}</span>
                    <input type="number" step={splitType === 'share' ? '1' : '0.01'} min="0"
                      value={s.value || ''}
                      onChange={(e) => updateSplitValue(s.userId, parseFloat(e.target.value) || 0)}
                      className="w-28 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    {splitType === 'exact' && amountNum > 0 && (
                      <span className="text-xs text-gray-400 w-16 text-right">
                        {((s.value / amountNum) * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {splitType === 'percentage' && Math.abs(totalSplitAmount - 100) > 0.01 && (
                <p className="mt-1 text-xs text-red-500">Percentages must sum to 100</p>
              )}
              {splitType === 'exact' && amountNum > 0 && Math.abs(totalSplitAmount - amountNum) > 0.01 && (
                <p className="mt-1 text-xs text-red-500">Amounts must sum to ₹{amountNum.toFixed(2)}</p>
              )}
            </div>
          )}

          <button type="submit"
            className="w-full bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700">
            Add Expense
          </button>
        </form>
      </div>
    </div>
  );
}
