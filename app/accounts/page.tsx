'use client';

import { useState, useEffect } from 'react';
import PlatformBadge from '@/components/PlatformBadge';

const PLATFORM_META: Record<string, { label: string; icon: string; color: string }> = {
  tiktok: { label: 'TikTok', icon: '🎵', color: '#fe2c55' },
  youtube: { label: 'YouTube', icon: '▶', color: '#ff4444' },
  instagram: { label: 'Instagram', icon: '◈', color: '#c13584' },
  x: { label: 'X', icon: '✕', color: '#c8c8c8' },
  linkedin: { label: 'LinkedIn', icon: 'in', color: '#0a9bcf' },
};

interface Account {
  id: number;
  name: string;
  username: string;
  color: string;
  platforms: string[];
  connected_platforms?: string[];
  created_at: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => { fetchAccounts(); }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      setAccounts(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    if (!apiKey.trim()) {
      setSyncResult({ type: 'error', message: 'Please enter your Upload-Post API key' });
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch('/api/accounts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSyncResult({ type: 'error', message: data.error || 'Sync failed' });
        return;
      }

      const created = data.synced.filter((s: { action: string }) => s.action === 'created').length;
      const updated = data.synced.filter((s: { action: string }) => s.action === 'updated').length;
      const parts = [];
      if (created) parts.push(`${created} added`);
      if (updated) parts.push(`${updated} updated`);

      setSyncResult({
        type: 'success',
        message: `Synced! ${parts.join(', ')} — ${data.plan} plan (${data.email})`,
      });
      setShowKeyInput(false);
      await fetchAccounts();
    } catch {
      setSyncResult({ type: 'error', message: 'Could not reach the server' });
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Remove this account?')) return;
    try {
      await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch { /* ignore */ }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display text-[24px] font-bold tracking-tight" style={{ color: '#eaeaee' }}>
            Accounts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#5c5c6a' }}>
            Auto-synced from your Upload-Post profiles
          </p>
        </div>
        <button
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[10px] transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(45,212,191,0.15), rgba(56,189,248,0.08))',
            color: '#2dd4bf',
            border: '1px solid rgba(45,212,191,0.2)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h3m6 0h3M7 1v3m0 6v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {accounts.length > 0 ? 'Re-sync' : 'Connect'}
        </button>
      </div>

      <div className="gradient-accent mb-6" />

      {/* Sync panel */}
      {showKeyInput && (
        <div className="glass-card gradient-border rounded-[14px] p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-[8px] flex items-center justify-center"
              style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.2)' }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="font-display font-semibold text-[13px]" style={{ color: '#eaeaee' }}>
              Sync from Upload-Post
            </h2>
          </div>

          <p className="text-[12px] mb-4" style={{ color: '#5c5c6a' }}>
            Paste your Upload-Post API key below. We'll auto-discover all your profiles
            and their connected platforms — no manual setup needed.
          </p>

          <div className="flex gap-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSync()}
              placeholder="Paste your Upload-Post API key"
              className="flex-1 rounded-[10px] px-4 py-2.5 text-sm font-mono transition-colors focus:outline-none"
              style={{
                background: 'rgba(14, 14, 18, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: '#eaeaee',
                backdropFilter: 'blur(16px)',
              }}
            />
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-5 py-2.5 rounded-[10px] text-sm font-semibold transition-all duration-200 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #2dd4bf, #14b8a6)',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
              }}
            >
              {syncing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
                    <path d="M12 2a10 10 0 019.8 8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </svg>
                  Syncing…
                </span>
              ) : 'Sync Accounts'}
            </button>
          </div>

          <p className="text-[11px] mt-3" style={{ color: '#444450' }}>
            Get your API key at{' '}
            <a
              href="https://app.upload-post.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{ color: '#2dd4bf' }}
            >
              app.upload-post.com/api-keys ↗
            </a>
          </p>
        </div>
      )}

      {/* Sync result toast */}
      {syncResult && (
        <div
          className="rounded-[10px] px-4 py-3 mb-6 text-xs flex items-center justify-between"
          style={{
            background: syncResult.type === 'success'
              ? 'rgba(52,211,153,0.06)'
              : 'rgba(251,146,60,0.06)',
            border: `1px solid ${syncResult.type === 'success'
              ? 'rgba(52,211,153,0.15)'
              : 'rgba(251,146,60,0.15)'}`,
            color: syncResult.type === 'success' ? '#34d399' : '#f59e0b',
          }}
        >
          {syncResult.message}
          <button
            onClick={() => setSyncResult(null)}
            className="ml-3 opacity-50 hover:opacity-100 transition-opacity"
          >✕</button>
        </div>
      )}

      {/* Accounts grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-[14px] shimmer" style={{ height: '140px' }} />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="glass-card gradient-border rounded-[14px] p-12 text-center">
          <div
            className="w-14 h-14 rounded-[12px] flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.15)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.6" />
              <path d="M4 20c0-4.418 3.582-7 8-7s8 2.582 8 7" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            </svg>
          </div>
          <p className="text-[15px] font-medium mb-1.5" style={{ color: '#eaeaee' }}>
            No accounts connected
          </p>
          <p className="text-[13px] mb-4" style={{ color: '#444450' }}>
            Click "Connect" above and paste your Upload-Post API key to auto-import your profiles
          </p>
          <button
            onClick={() => setShowKeyInput(true)}
            className="px-5 py-2.5 rounded-[10px] text-sm font-semibold transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(45,212,191,0.15), rgba(56,189,248,0.08))',
              color: '#2dd4bf',
              border: '1px solid rgba(45,212,191,0.2)',
            }}
          >
            Connect Upload-Post ↗
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="glass-card gradient-border rounded-[14px] p-5 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-[10px] flex items-center justify-center text-sm font-bold font-display text-white flex-shrink-0"
                    style={{ backgroundColor: account.color, boxShadow: `0 4px 14px ${account.color}30` }}
                  >
                    {account.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: '#eaeaee' }}>
                      {account.name}
                    </div>
                    <div className="text-[11px] font-mono" style={{ color: '#555' }}>
                      @{account.username}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(account.id)}
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  style={{ color: '#555' }}
                  title="Remove account"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 3.5h10M5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M5.5 6v5M8.5 6v5M3.5 3.5l.5 8.5h6l.5-8.5"
                      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Connected platforms */}
              <div className="text-[10px] uppercase tracking-widest font-medium mb-2" style={{ color: '#333340' }}>
                Connected Platforms
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(account.platforms as string[]).length > 0 ? (
                  (account.platforms as string[]).map((p) => (
                    <PlatformBadge key={p} platform={p} size="sm" />
                  ))
                ) : (
                  <span className="text-[11px]" style={{ color: '#444450' }}>
                    No platforms connected on Upload-Post
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info footer */}
      {accounts.length > 0 && (
        <div className="glass-card rounded-[10px] px-4 py-3 mt-6 flex items-center gap-3 text-[11px]" style={{ color: '#444450' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 4v1M7 6.5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          To add or remove platform connections, manage them at{' '}
          <a
            href="https://app.upload-post.com/manage-users"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2dd4bf' }}
          >
            upload-post.com ↗
          </a>
          , then click "Re-sync" to update here.
        </div>
      )}
    </div>
  );
}
