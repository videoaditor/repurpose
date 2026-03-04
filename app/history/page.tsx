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
    posted: { label: 'Posted', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
    scheduled: { label: 'Scheduled', color: '#f59e0b', bg: 'rgba(251,146,60,0.08)' },
    failed: { label: 'Failed', color: '#f43f5e', bg: 'rgba(239,68,68,0.08)' },
    pending: { label: 'Pending', color: '#5c5c6a', bg: 'rgba(107,107,107,0.08)' },
  };
  const cfg = map[status] ?? map.pending;
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded-md border"
      style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: `${cfg.color}25` }}
    >
      {cfg.label}
    </span>
  );
}

const ALL_PLATFORMS = ['tiktok', 'youtube', 'instagram', 'x', 'linkedin'];
const ALL_STATUSES = ['posted', 'scheduled', 'failed', 'pending'];

export default function HistoryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/accounts').then((r) => r.json()),
      fetch('/api/history').then((r) => r.json()).catch(() => []),
    ]).then(([accs, postsData]) => {
      setAccounts(Array.isArray(accs) ? accs : []);
      setPosts(Array.isArray(postsData) ? postsData : []);
    }).finally(() => setLoading(false));
  }, []);

  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

  const filtered = posts.filter((p) => {
    if (accountFilter !== 'all' && p.account_id !== parseInt(accountFilter)) return false;
    if (platformFilter !== 'all' && !(p.platforms as string[]).includes(platformFilter)) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const platformColors: Record<string, string> = {
    tiktok: '#fe2c55',
    youtube: '#ff0000',
    instagram: '#c13584',
    x: '#e7e7e7',
    linkedin: '#0077b5',
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight" style={{ color: '#eaeaee' }}>
            Post History
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#5c5c6a' }}>
            Track all published content
          </p>
        </div>
        <Link
          href="/post"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[10px] transition-all duration-150"
          style={{
            background: 'rgba(45,212,191,0.12)',
            color: '#2dd4bf',
            border: '1px solid rgba(45,212,191,0.2)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          New Post
        </Link>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Account selector */}
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="text-xs font-medium rounded-[8px] px-3 py-1.5 transition-colors"
          style={{
            background: '#111111',
            border: '1px solid #1e1e1e',
            color: '#eaeaee',
            outline: 'none',
          }}
        >
          <option value="all">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {/* Platform pills */}
        <div className="flex items-center gap-1.5">
          {['all', ...ALL_PLATFORMS].map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-[6px] transition-all duration-150"
              style={{
                background: platformFilter === p
                  ? p === 'all' ? 'rgba(45,212,191,0.12)' : `${platformColors[p]}15`
                  : 'transparent',
                color: platformFilter === p
                  ? p === 'all' ? '#2dd4bf' : platformColors[p]
                  : '#444450',
                border: `1px solid ${platformFilter === p
                  ? p === 'all' ? 'rgba(45,212,191,0.2)' : `${platformColors[p]}30`
                  : '#16161e'}`,
              }}
            >
              {p === 'all' ? 'All platforms' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1.5">
          {['all', ...ALL_STATUSES].map((s) => {
            const colors: Record<string, string> = {
              all: '#2dd4bf',
              posted: '#34d399',
              scheduled: '#f59e0b',
              failed: '#f43f5e',
              pending: '#5c5c6a',
            };
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-[6px] transition-all duration-150"
                style={{
                  background: statusFilter === s ? `${colors[s]}12` : 'transparent',
                  color: statusFilter === s ? colors[s] : '#444450',
                  border: `1px solid ${statusFilter === s ? `${colors[s]}25` : '#16161e'}`,
                }}
              >
                {s === 'all' ? 'All status' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            );
          })}
        </div>

        <div className="ml-auto text-xs" style={{ color: '#333' }}>
          {filtered.length} post{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[14px] p-5 shimmer"
              style={{ height: '88px', border: '1px solid #16161e' }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-[14px] p-14 text-center"
          style={{ background: '#111111', border: '1px dashed #1e1e1e' }}
        >
          <div
            className="w-12 h-12 rounded-[12px] flex items-center justify-center mx-auto mb-4"
            style={{ background: '#16161e' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="#252530" strokeWidth="1.5" />
              <path d="M10 6v4l2.5 2" stroke="#252530" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: '#444450' }}>No posts found</p>
          <p className="text-xs mb-4" style={{ color: '#252530' }}>
            {accountFilter !== 'all' || platformFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first post to see it here'}
          </p>
          <Link
            href="/post"
            className="text-xs transition-colors"
            style={{ color: '#2dd4bf' }}
          >
            Create a post →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const account = accountMap[post.account_id];
            return (
              <div
                key={post.id}
                className="rounded-[14px] p-5 transition-all duration-150 card-hover"
                style={{
                  background: '#111111',
                  border: '1px solid #1e1e1e',
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Account avatar */}
                  {account && (
                    <div
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: account.color, boxShadow: `0 2px 8px ${account.color}25` }}
                    >
                      {account.name[0].toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <span className="text-sm font-medium truncate" style={{ color: '#eaeaee' }}>
                        {post.title}
                      </span>
                      <StatusBadge status={post.status} />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      {account && (
                        <span className="text-xs" style={{ color: '#444450' }}>
                          {account.name}
                        </span>
                      )}
                      <span className="text-xs font-mono tabular-nums" style={{ color: '#333' }}>
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <div className="flex gap-1">
                        {(post.platforms as string[]).map((p) => (
                          <PlatformBadge key={p} platform={p} size="sm" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {post.request_id && (
                      <Link
                        href={`/analytics?requestId=${post.request_id}`}
                        className="text-[11px] px-3 py-1.5 rounded-[8px] transition-all font-medium"
                        style={{
                          background: 'rgba(45,212,191,0.08)',
                          color: '#2dd4bf',
                          border: '1px solid rgba(45,212,191,0.15)',
                        }}
                      >
                        View Analytics
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
