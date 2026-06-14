import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { type Group, type BalanceEntry } from '../types';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

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
        const flat: BalanceEntry[] = summary.map((s, i) => ({
          userId: i,
          userName: '',
          owes: s.owes,
          owedBy: s.owedBy,
        }));
        setBalances(flat);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalOwed = balances.flatMap((b) => b.owedBy).reduce((sum, x) => sum + x.amount, 0);
  const totalOwes = balances.flatMap((b) => b.owes).reduce((sum, x) => sum + x.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Hello, {user?.name}</h2>
          <button onClick={() => navigate('/groups/new')}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">
            + New Group
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
            <p className="text-sm text-gray-500 mb-1">You are owed</p>
            <p className="text-2xl font-bold text-green-600">₹{totalOwed.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
            <p className="text-sm text-gray-500 mb-1">You owe</p>
            <p className="text-2xl font-bold text-red-600">₹{totalOwes.toFixed(2)}</p>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Groups</h3>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
            No groups yet. Create one to get started!
          </div>
        ) : (
          <div className="grid gap-3">
            {groups.map((g) => (
              <Link key={g.id} to={`/groups/${g.id}`}
                className="bg-white rounded-xl shadow p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="font-semibold text-gray-800">{g.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{g.member_count} members</p>
                </div>
                <span className="text-teal-600 text-sm font-medium">View →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
