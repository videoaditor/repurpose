'use client';

import { useState, useEffect, useCallback } from 'react';
import PlatformBadge from '@/components/PlatformBadge';

interface Account {
  id: number;
  name: string;
  username: string;
  color: string;
  platforms: string[];
}

interface AutomationRule {
  id: number;
  account_id: number;
  enabled: boolean;
  source_platform: string;
  target_platforms: string[];
  last_checked_at: string | null;
  last_reel_id: string | null;
  created_at: string;
}

interface RuleWithAccount {
  rule: AutomationRule;
  account: Account | null;
}

const TARGET_PLATFORMS = [
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'x', label: 'X' },
  { id: 'linkedin', label: 'LinkedIn' },
];

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AutomationPage() {
  const [rules, setRules] = useState<RuleWithAccount[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [triggeringId, setTriggeringId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showManualForm, setShowManualForm] = useState<number | null>(null);
  const [manualUrl, setManualUrl] = useState('');

  const [form, setForm] = useState({
    account_id: '',
    target_platforms: [] as string[],
    enabled: true,
  });

  const fetchRules = useCallback(async () => {
    const res = await fetch('/api/automation');
    const data = await res.json();
    setRules(data);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/accounts').then((r) => r.json()),
      fetch('/api/automation').then((r) => r.json()),
    ]).then(([accs, rls]) => {
      setAccounts(accs);
      setRules(rls);
      if (accs.length > 0 && !form.account_id) {
        setForm((f) => ({ ...f, account_id: String(accs[0].id) }));
      }
      setLoading(false);
    });
  }, []);

  function toggleTarget(id: string) {
    setForm((f) => ({
      ...f,
      target_platforms: f.target_platforms.includes(id)
        ? f.target_platforms.filter((p) => p !== id)
        : [...f.target_platforms, id],
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.account_id || form.target_platforms.length === 0) {
      setError('Select an account and at least one target platform');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      setForm({ account_id: String(accounts[0]?.id || ''), target_platforms: [], enabled: true });
      setSuccess('Automation rule created');
      await fetchRules();
    } catch {
      setError('Failed to create rule');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(rule: AutomationRule) {
    const res = await fetch(`/api/automation/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !rule.enabled }),
    });
    if (res.ok) await fetchRules();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this automation rule?')) return;
    await fetch(`/api/automation/${id}`, { method: 'DELETE' });
    await fetchRules();
  }

  async function handleTrigger(rule: AutomationRule, reelUrl?: string) {
    setTriggeringId(rule.id);
    setError('');
    setSuccess('');
    try {
      const body = reelUrl ? { reel_url: reelUrl } : {};
      const res = await fetch(`/api/automation/${rule.id}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Trigger failed');
      setSuccess(
        data.processed > 0
          ? `Processed ${data.processed} reel(s) — ${data.results?.filter((r: { status: string }) => r.status === 'posted').length ?? 0} posted`
          : data.message || 'No new reels found'
      );
      setShowManualForm(null);
      setManualUrl('');
      await fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trigger failed');
    } finally {
      setTriggeringId(null);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-[22px] font-bold tracking-tight" style={{ color: '#f5f5f5' }}>
          Automation
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#6b6b6b' }}>
          Auto-crosspost Instagram Reels to YouTube &amp; TikTok
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Create rule form */}
        <div className="lg:col-span-2">
          <div
            className="rounded-[14px] p-5"
            style={{ background: '#111111', border: '1px solid #1e1e1e' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#f5f5f5' }}>
              New Automation Rule
            </h2>

            {/* How it works note */}
            <div
              className="rounded-[10px] p-3 mb-4 text-[11px] leading-relaxed"
              style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)', color: '#888' }}
            >
              <span style={{ color: '#a78bfa' }}>How it works:</span> Select an account that has Instagram connected.
              When a new Reel is detected (or you click &ldquo;Check Now&rdquo;), the system auto-generates captions
              and crossposts to your chosen platforms.
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Source */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#888' }}>
                  Source Platform
                </label>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-sm"
                  style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', color: '#a78bfa' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="10.2" cy="3.8" r="0.7" fill="currentColor" />
                  </svg>
                  Instagram (Reels)
                </div>
              </div>

              {/* Account */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#888' }}>
                  Account
                </label>
                {accounts.length === 0 ? (
                  <p className="text-xs" style={{ color: '#555' }}>
                    No accounts found.{' '}
                    <a href="/accounts" style={{ color: '#a78bfa' }}>Add one →</a>
                  </p>
                ) : (
                  <select
                    value={form.account_id}
                    onChange={(e) => setForm((f) => ({ ...f, account_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-[10px] text-sm focus:outline-none"
                    style={{
                      background: '#0f0f0f',
                      border: '1px solid #1e1e1e',
                      color: '#f5f5f5',
                    }}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (@{a.username})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Target platforms */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#888' }}>
                  Crosspost To
                </label>
                <div className="flex flex-wrap gap-2">
                  {TARGET_PLATFORMS.map((p) => {
                    const selected = form.target_platforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleTarget(p.id)}
                        className="px-3 py-1.5 rounded-[8px] text-xs font-medium border transition-all duration-150"
                        style={
                          selected
                            ? { background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }
                            : { background: '#0f0f0f', border: '1px solid #1e1e1e', color: '#555' }
                        }
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Enabled */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: '#888' }}>
                  Start enabled
                </label>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
                  className="relative w-10 h-5 rounded-full transition-colors duration-200"
                  style={{ background: form.enabled ? '#a78bfa' : '#2a2a2a' }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                    style={{
                      background: '#fff',
                      transform: form.enabled ? 'translateX(20px)' : 'translateX(0)',
                    }}
                  />
                </button>
              </div>

              {error && (
                <p
                  className="text-xs px-3 py-2 rounded-[8px]"
                  style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  {error}
                </p>
              )}
              {success && (
                <p
                  className="text-xs px-3 py-2 rounded-[8px]"
                  style={{ color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)' }}
                >
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || accounts.length === 0}
                className="w-full py-2.5 rounded-[10px] text-sm font-medium transition-all disabled:opacity-40"
                style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)' }}
              >
                {submitting ? 'Creating...' : 'Create Rule'}
              </button>
            </form>
          </div>
        </div>

        {/* Rules list */}
        <div className="lg:col-span-3">
          <h2
            className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-3"
            style={{ color: '#333' }}
          >
            Active Rules
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 rounded-[14px] animate-pulse" style={{ background: '#111', border: '1px solid #1e1e1e' }} />
              ))}
            </div>
          ) : rules.length === 0 ? (
            <div
              className="rounded-[14px] p-10 text-center"
              style={{ background: '#111', border: '1px dashed #1e1e1e' }}
            >
              <p className="text-sm" style={{ color: '#4a4a4a' }}>
                No automation rules yet. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map(({ rule, account }) => (
                <div
                  key={rule.id}
                  className="rounded-[14px] p-4"
                  style={{ background: '#111', border: '1px solid #1e1e1e' }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {account && (
                        <div
                          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: account.color }}
                        >
                          {account.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: '#f5f5f5' }}>
                          {account?.name ?? 'Unknown Account'}
                        </div>
                        <div className="text-[11px] font-mono" style={{ color: '#555' }}>
                          @{account?.username ?? '?'} · IG → {(rule.target_platforms as string[]).join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(rule)}
                      className="relative w-9 h-[18px] rounded-full flex-shrink-0 transition-colors duration-200"
                      style={{ background: rule.enabled ? '#a78bfa' : '#2a2a2a' }}
                      title={rule.enabled ? 'Disable' : 'Enable'}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform duration-200"
                        style={{
                          background: '#fff',
                          transform: rule.enabled ? 'translateX(18px)' : 'translateX(0)',
                        }}
                      />
                    </button>
                  </div>

                  {/* Platforms */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-[6px] border"
                      style={{ color: '#e1306c', background: 'rgba(225,48,108,0.08)', borderColor: 'rgba(225,48,108,0.2)' }}
                    >
                      IG Source
                    </span>
                    {(rule.target_platforms as string[]).map((p) => (
                      <PlatformBadge key={p} platform={p} size="sm" />
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 mb-3">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: '#333' }}>Last Checked</div>
                      <div className="text-[11px] font-mono" style={{ color: '#6b6b6b' }}>{fmtDate(rule.last_checked_at)}</div>
                    </div>
                    {rule.last_reel_id && (
                      <div>
                        <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: '#333' }}>Last Reel ID</div>
                        <div className="text-[11px] font-mono truncate max-w-[120px]" style={{ color: '#6b6b6b' }}>{rule.last_reel_id}</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTrigger(rule)}
                      disabled={triggeringId === rule.id}
                      className="flex-1 py-1.5 rounded-[8px] text-xs font-medium transition-all disabled:opacity-40"
                      style={{ background: 'rgba(167,139,250,0.08)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.15)' }}
                    >
                      {triggeringId === rule.id ? 'Checking...' : 'Check Now'}
                    </button>
                    <button
                      onClick={() => setShowManualForm(showManualForm === rule.id ? null : rule.id)}
                      className="flex-1 py-1.5 rounded-[8px] text-xs font-medium transition-all"
                      style={{ background: 'rgba(52,211,153,0.06)', color: '#34d399', border: '1px solid rgba(52,211,153,0.12)' }}
                    >
                      Post Reel URL
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="w-7 h-7 rounded-[8px] flex items-center justify-center transition-all"
                      style={{ color: '#444', border: '1px solid #1e1e1e' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M2 3.5h10M5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M5.5 6v5M8.5 6v5M3.5 3.5l.5 8.5h6l.5-8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  {/* Manual URL form */}
                  {showManualForm === rule.id && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid #1a1a1a' }}>
                      <p className="text-[11px] mb-2" style={{ color: '#555' }}>
                        Paste an Instagram Reel URL to manually trigger a crosspost:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={manualUrl}
                          onChange={(e) => setManualUrl(e.target.value)}
                          placeholder="https://www.instagram.com/reel/..."
                          className="flex-1 px-3 py-1.5 rounded-[8px] text-xs focus:outline-none"
                          style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', color: '#f5f5f5' }}
                        />
                        <button
                          onClick={() => manualUrl && handleTrigger(rule, manualUrl)}
                          disabled={!manualUrl || triggeringId === rule.id}
                          className="px-3 py-1.5 rounded-[8px] text-xs font-medium disabled:opacity-40"
                          style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
