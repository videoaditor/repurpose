'use client';

import { useState, useEffect } from 'react';
import PlatformBadge from '@/components/PlatformBadge';

const PRESET_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ALL_PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'youtube', label: 'YouTube', icon: '▶' },
  { id: 'instagram', label: 'Instagram', icon: '◈' },
  { id: 'x', label: 'X', icon: '✕' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'in' },
];

interface Account {
  id: number;
  name: string;
  username: string;
  color: string;
  platforms: string[];
  created_at: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    username: '',
    api_key: '',
    color: PRESET_COLORS[0],
    platforms: [] as string[],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      setAccounts(data);
    } catch {
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }

  function togglePlatform(id: string) {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(id)
        ? f.platforms.filter((p) => p !== id)
        : [...f.platforms, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.name || !form.username || !form.api_key) {
      setError('Name, username, and API key are required');
      return;
    }
    if (form.platforms.length === 0) {
      setError('Select at least one platform');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create account');
      setForm({ name: '', username: '', api_key: '', color: PRESET_COLORS[0], platforms: [] });
      await fetchAccounts();
    } catch {
      setError('Failed to create account. Check your details.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this account? This cannot be undone.')) return;
    try {
      await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError('Failed to delete account');
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">Accounts</h1>
        <p className="text-sm text-[#555] mt-0.5">Connect your Upload-Post profiles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Add account form */}
        <div className="lg:col-span-2">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
            <h2 className="font-display font-semibold text-white text-sm mb-4">Add Account</h2>

            <p className="text-[11px] text-[#555] mb-4 leading-relaxed border border-[#1a1a1a] rounded-lg p-2.5 bg-[#0f0f0f]">
              Connect platforms at{' '}
              <span className="text-indigo-400">upload-post.com</span>{' '}
              first, then add your profile here.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Name */}
              <div>
                <label className="block text-xs text-[#888] mb-1.5 font-medium">Account Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="My Brand"
                  className="w-full bg-[#0f0f0f] border border-[#1e1e1e] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs text-[#888] mb-1.5 font-medium">Upload-Post Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444] text-sm">@</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    placeholder="username"
                    className="w-full bg-[#0f0f0f] border border-[#1e1e1e] rounded-lg pl-7 pr-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs text-[#888] mb-1.5 font-medium">API Key</label>
                <input
                  type="password"
                  value={form.api_key}
                  onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                  placeholder="••••••••••••••••"
                  className="w-full bg-[#0f0f0f] border border-[#1e1e1e] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs text-[#888] mb-1.5 font-medium">Color</label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color }))}
                      className="w-7 h-7 rounded-lg transition-all duration-150"
                      style={{
                        backgroundColor: color,
                        boxShadow: form.color === color ? `0 0 0 2px #0a0a0a, 0 0 0 4px ${color}` : 'none',
                        transform: form.color === color ? 'scale(1.1)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-xs text-[#888] mb-1.5 font-medium">Platforms</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_PLATFORMS.map((p) => {
                    const selected = form.platforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlatform(p.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                          selected
                            ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                            : 'border-[#1e1e1e] bg-[#0f0f0f] text-[#555] hover:text-[#888] hover:border-[#2a2a2a]'
                        }`}
                      >
                        <span>{p.icon}</span>
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
              >
                {submitting ? 'Adding...' : 'Add Account'}
              </button>
            </form>
          </div>
        </div>

        {/* Accounts list */}
        <div className="lg:col-span-3">
          <h2 className="font-display font-semibold text-[#888] text-xs uppercase tracking-widest mb-3">
            Connected Accounts
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 animate-pulse h-24" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-[#111] border border-[#1e1e1e] border-dashed rounded-xl p-8 text-center">
              <p className="text-[#555] text-sm">No accounts added yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 flex items-center gap-4 hover:border-[#2a2a2a] transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-display text-white flex-shrink-0"
                    style={{ backgroundColor: account.color, boxShadow: `0 4px 14px ${account.color}30` }}
                  >
                    {account.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm">{account.name}</span>
                      <span className="text-[11px] text-[#555] font-mono">@{account.username}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(account.platforms as string[]).map((p) => (
                        <PlatformBadge key={p} platform={p} size="sm" />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(account.id)}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[#555] hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 3.5h10M5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M5.5 6v5M8.5 6v5M3.5 3.5l.5 8.5h6l.5-8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
