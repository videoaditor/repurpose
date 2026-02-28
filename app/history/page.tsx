'use client';

import { useState, useEffect } from 'react';
import PlatformBadge from '@/components/PlatformBadge';
import Link from 'next/link';

interface Account {
  id: number;
  name: string;
  color: string;
}

interface Post {
  id: number;
  account_id: number;
  title: string;
  platforms: string[];
  status: string;
  created_at: string;
  request_id: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    posted: { label: 'Posted', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    scheduled: { label: 'Scheduled', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    failed: { label: 'Failed', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    pending: { label: 'Pending', color: '#888', bg: 'rgba(136,136,136,0.1)' },
  };
  const cfg = map[status] ?? map.pending;
  return (
    <span
      className="text-[11px] font-medium px-2 py-0.5 rounded-md border"
      style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: `${cfg.color}30` }}
    >
      {cfg.label}
    </span>
  );
}

export default function HistoryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/accounts').then((r) => r.json()),
      fetchPosts(),
    ]).then(([accs]) => {
      setAccounts(accs);
    });
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch('/api/history');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(data);
    } catch {
      // fallback — fetch all posts via accounts
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

  const filtered = accountFilter === 'all'
    ? posts
    : posts.filter((p) => p.account_id === parseInt(accountFilter));

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Post History</h1>
          <p className="text-sm text-[#555] mt-0.5">Track all published content</p>
        </div>
        <Link
          href="/post"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New Post
        </Link>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-5">
        <label className="text-xs text-[#555] font-medium">Filter by account:</label>
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
        >
          <option value="all">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b border-[#0f0f0f] px-5 py-4 animate-pulse">
              <div className="h-4 bg-[#1a1a1a] rounded w-48 mb-2" />
              <div className="h-3 bg-[#161616] rounded w-32" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#111] border border-[#1e1e1e] border-dashed rounded-xl p-12 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center mx-auto mb-3">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="#555" strokeWidth="1.5" />
              <path d="M9 5.5V9l2 2" stroke="#555" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[#555] text-sm">No posts found.</p>
          <Link href="/post" className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors mt-1 inline-block">
            Create your first post →
          </Link>
        </div>
      ) : (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {['Date', 'Title', 'Account', 'Platforms', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] text-[#555] uppercase tracking-widest font-medium px-4 py-3 first:pl-5 last:pr-5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => {
                const account = accountMap[post.account_id];
                return (
                  <tr
                    key={post.id}
                    className="border-b border-[#0f0f0f] hover:bg-[#0f0f0f] transition-colors last:border-0 group"
                  >
                    <td className="px-4 py-3.5 pl-5">
                      <span className="text-xs text-[#555] font-mono whitespace-nowrap">
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-white font-medium truncate max-w-[200px] block">
                        {post.title}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {account ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: account.color }}
                          >
                            {account.name[0].toUpperCase()}
                          </div>
                          <span className="text-xs text-[#888] whitespace-nowrap">{account.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#555]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(post.platforms as string[]).slice(0, 3).map((p) => (
                          <PlatformBadge key={p} platform={p} size="sm" />
                        ))}
                        {(post.platforms as string[]).length > 3 && (
                          <span className="text-[10px] text-[#555] self-center">
                            +{(post.platforms as string[]).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-4 py-3.5 pr-5">
                      {post.request_id ? (
                        <Link
                          href={`/history/${post.id}`}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Analytics →
                        </Link>
                      ) : (
                        <span className="text-[11px] text-[#333]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="px-5 py-3 border-t border-[#1a1a1a] flex items-center justify-between">
            <span className="text-xs text-[#555]">
              {filtered.length} post{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
