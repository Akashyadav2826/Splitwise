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
  const navigate = useNavigate();

  async function handleSearch() {
    if (search.trim().length < 2) return;
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(search)}`);
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    }
  }

  function addMember(user: User) {
    if (!selectedMembers.find((m) => m.id === user.id)) {
      setSelectedMembers((prev) => [...prev, user]);
    }
    setSearch('');
    setSearchResults([]);
  }

  function removeMember(id: number) {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/groups', { name, memberIds: selectedMembers.map((m) => m.id) });
      navigate(`/groups/${res.data.id}`);
    } catch {
      setError('Failed to create group');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Group</h2>
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              placeholder="e.g. Thailand Trip 2025"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Add Members</label>
            <div className="flex gap-2">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <button type="button" onClick={handleSearch}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium">Search</button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg divide-y">
                {searchResults.map((u) => (
                  <button key={u.id} type="button" onClick={() => addMember(u)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between">
                    <span>{u.name} <span className="text-gray-400 text-xs">{u.email}</span></span>
                    <span className="text-teal-600 text-xs">+ Add</span>
                  </button>
                ))}
              </div>
            )}
            {selectedMembers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedMembers.map((m) => (
                  <span key={m.id} className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {m.name}
                    <button type="button" onClick={() => removeMember(m.id)} className="ml-1 font-bold">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <button type="submit"
            className="w-full bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700">
            Create Group
          </button>
        </form>
      </div>
    </div>
  );
}
