import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { type Group, type Expense, type BalanceEntry, type User } from '../types';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'expenses' | 'balances' | 'members';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<BalanceEntry[]>([]);
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
  }

  async function removeMember(userId: number) {
    await api.delete(`/groups/${id}/members/${userId}`);
    const res = await api.get(`/groups/${id}`);
    setGroup(res.data);
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-6 text-gray-400">Loading…</div></div>;
  if (!group) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-6">Group not found</div></div>;

  const myBalance = balances.find((b) => b.userId === user?.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => navigate('/dashboard')} className="text-sm text-teal-600 hover:underline mb-1 block">← Dashboard</button>
            <h2 className="text-2xl font-bold text-gray-800">{group.name}</h2>
          </div>
          <Link to={`/groups/${id}/expenses/new`}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">
            + Add Expense
          </Link>
        </div>

        {myBalance && (myBalance.owes.length > 0 || myBalance.owedBy.length > 0) && (
          <div className="bg-white rounded-xl shadow p-4 mb-5 flex flex-wrap gap-4 text-sm">
            {myBalance.owes.map((o) => (
              <span key={o.userId} className="text-red-600">You owe {o.userName} ₹{o.amount.toFixed(2)}</span>
            ))}
            {myBalance.owedBy.map((o) => (
              <span key={o.userId} className="text-green-600">{o.userName} owes you ₹{o.amount.toFixed(2)}</span>
            ))}
          </div>
        )}

        <div className="flex border-b border-gray-200 mb-5">
          {(['expenses', 'balances', 'members'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize ${tab === t ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'expenses' && (
          <div className="space-y-3">
            {expenses.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">No expenses yet.</div>
            ) : expenses.map((e) => (
              <Link key={e.id} to={`/groups/${id}/expenses/${e.id}`}
                className="bg-white rounded-xl shadow p-4 flex items-center justify-between hover:shadow-md transition-shadow block">
                <div>
                  <p className="font-medium text-gray-800">{e.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Paid by {e.paid_by_name} · {e.split_type}</p>
                </div>
                <span className="text-lg font-semibold text-gray-700">₹{parseFloat(e.amount).toFixed(2)}</span>
              </Link>
            ))}
          </div>
        )}

        {tab === 'balances' && (
          <div className="space-y-3">
            {balances.filter((b) => b.owes.length > 0 || b.owedBy.length > 0).length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">All settled up!</div>
            ) : balances.map((b) => (
              <div key={b.userId} className="bg-white rounded-xl shadow p-4">
                <p className="font-medium text-gray-800 mb-2">{b.userName}</p>
                {b.owes.map((o) => (
                  <div key={o.userId} className="flex items-center justify-between text-sm">
                    <span className="text-red-600">owes {o.userName}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">₹{o.amount.toFixed(2)}</span>
                      {b.userId === user?.id && (
                        <Link to={`/groups/${id}/settle?payerId=${b.userId}&payeeId=${o.userId}&amount=${o.amount}`}
                          className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded hover:bg-teal-200">
                          Settle
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
                {b.owedBy.map((o) => (
                  <div key={o.userId} className="flex items-center justify-between text-sm">
                    <span className="text-green-600">owed by {o.userName}</span>
                    <span className="font-medium">₹{o.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab === 'members' && (
          <div className="bg-white rounded-xl shadow p-5">
            <div className="space-y-3 mb-5">
              {(group.members || []).map((m) => (
                <div key={m.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.email}</p>
                  </div>
                  {group.created_by === user?.id && m.id !== user?.id && (
                    <button onClick={() => removeMember(m.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Add Member</p>
              <div className="flex gap-2">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <button onClick={handleSearchMember} className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm">Search</button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg divide-y">
                  {searchResults.map((u) => (
                    <button key={u.id} onClick={() => addMember(u.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between">
                      <span>{u.name} <span className="text-gray-400 text-xs">{u.email}</span></span>
                      <span className="text-teal-600 text-xs">+ Add</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
