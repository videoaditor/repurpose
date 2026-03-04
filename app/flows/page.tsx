'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/* ─── Types ─── */
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

/* ─── Constants ─── */
const PLATFORM_COLORS: Record<string, string> = {
  tiktok: '#fe2c55',
  youtube: '#ff4444',
  instagram: '#c13584',
  x: '#c8c8c8',
  linkedin: '#0a9bcf',
};

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube',
  instagram: 'Instagram',
  x: 'X',
  linkedin: 'LinkedIn',
};

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

/* ─── Platform icon component ─── */
function PlatformIcon({ platform, size = 28 }: { platform: string; size?: number }) {
  const color = PLATFORM_COLORS[platform] ?? '#888';
  const icons: Record<string, React.ReactNode> = {
    youtube: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill={color}>
        <path d="M12.9 3.8S12.7 2.4 12 1.7C11.2.9 10.3.9 10 .8 8.5.7 7 .7 7 .7S5.5.7 4 .8c-.3 0-1.2.1-2 .9-.7.7-.9 2.1-.9 2.1S1 5.4 1 6.9v1.2c0 1.5.1 2.9.1 2.9s.2 1.4.9 2.1c.8.8 1.9.8 2.4.8C6 14 7 14 7 14s1.5 0 3-.1c.3 0 1.2-.1 2-.9.7-.7.9-2.1.9-2.1S13 9.5 13 8V6.9c0-1.5-.1-3.1-.1-3.1zM5.7 9.4V4.6l4 2.4-4 2.4z" />
      </svg>
    ),
    tiktok: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.13a8.16 8.16 0 0 0 4.77 1.52V7.2a4.85 4.85 0 0 1-1-.51z" />
      </svg>
    ),
    instagram: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" stroke={color} strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.8" />
        <circle cx="17.5" cy="6.5" r="1" fill={color} />
      </svg>
    ),
    x: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    linkedin: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  };
  return (
    <div
      className="rounded-[8px] flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: `${color}10`,
        border: `1px solid ${color}20`,
      }}
    >
      {icons[platform] ?? <span style={{ fontSize: 10, color }}>{platform[0].toUpperCase()}</span>}
    </div>
  );
}

/* ─── New Flow dialog ─── */
function NewFlowDialog({
  accounts,
  onSave,
}: {
  accounts: Account[];
  onSave: (data: { account_id: string; target_platforms: string[]; enabled: boolean }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [targets, setTargets] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(String(accounts[0].id));
    }
  }, [accounts, accountId]);

  function toggleTarget(p: string) {
    setTargets((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function handleSave() {
    if (!accountId || targets.length === 0) {
      setError('Select an account and at least one destination');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ account_id: accountId, target_platforms: targets, enabled: true });
      setTargets([]);
      setOpen(false);
    } catch {
      setError('Failed to create flow');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-[10px] transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(45,212,191,0.15), rgba(56,189,248,0.08))',
            color: '#2dd4bf',
            border: '1px solid rgba(45,212,191,0.2)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          New Flow
        </button>
      </DialogTrigger>

      <DialogContent
        className="max-w-md"
        style={{
          background: '#0c0c10',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          color: '#eaeaee',
          backdropFilter: 'blur(24px)',
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: '#eaeaee', fontSize: '16px', fontWeight: 700 }}>
            Create New Flow
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* Source */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#5c5c6a' }}>
              Source Platform
            </label>
            <div
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] text-sm"
              style={{ background: '#08080c', border: '1px solid #1a1a22', color: '#c13584' }}
            >
              <PlatformIcon platform="instagram" size={22} />
              <span style={{ color: '#eaeaee' }}>Instagram (Reels)</span>
            </div>
          </div>

          {/* Account */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#5c5c6a' }}>
              Account
            </label>
            {accounts.length === 0 ? (
              <p className="text-xs" style={{ color: '#555' }}>
                No accounts found. <a href="/accounts" style={{ color: '#2dd4bf' }}>Add one →</a>
              </p>
            ) : (
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] text-sm focus:outline-none"
                style={{ background: '#08080c', border: '1px solid #1a1a22', color: '#eaeaee' }}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (@{a.username})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Destinations */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: '#5c5c6a' }}>
              Destinations
            </label>
            <div className="space-y-1.5">
              {TARGET_PLATFORMS.map((p) => {
                const checked = targets.includes(p.id);
                const color = PLATFORM_COLORS[p.id] ?? '#888';
                return (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-all duration-150"
                    style={{
                      border: `1px solid ${checked ? `${color}30` : '#1a1a22'}`,
                      background: checked ? `${color}06` : 'transparent',
                    }}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggleTarget(p.id)} className="sr-only" />
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        background: checked ? color : 'transparent',
                        border: `1.5px solid ${checked ? color : '#252530'}`,
                      }}
                    >
                      {checked && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <PlatformIcon platform={p.id} size={22} />
                    <span className="text-sm" style={{ color: checked ? '#eaeaee' : '#5c5c6a' }}>
                      {p.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {error && (
            <p
              className="text-xs px-3 py-2 rounded-[8px]"
              style={{ color: '#f43f5e', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}
            >
              {error}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving || accounts.length === 0 || targets.length === 0}
            className="w-full py-2.5 text-sm font-semibold rounded-[10px] transition-all duration-200 disabled:opacity-30"
            style={{
              background: 'linear-gradient(135deg, rgba(45,212,191,0.18), rgba(56,189,248,0.10))',
              color: '#2dd4bf',
              border: '1px solid rgba(45,212,191,0.25)',
            }}
          >
            {saving ? 'Creating…' : 'Create Flow'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function FlowsPage() {
  const [rules, setRules] = useState<RuleWithAccount[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [manualFormId, setManualFormId] = useState<number | null>(null);
  const [manualUrl, setManualUrl] = useState('');

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

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
      setAccounts(Array.isArray(accs) ? accs : []);
      setRules(Array.isArray(rls) ? rls : []);
      setLoading(false);
    });
  }, []);

  async function handleCreate(data: { account_id: string; target_platforms: string[]; enabled: boolean }) {
    const res = await fetch('/api/automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed');
    showToast('Flow created');
    await fetchRules();
  }

  async function handleToggle(rule: AutomationRule) {
    const res = await fetch(`/api/automation/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !rule.enabled }),
    });
    if (res.ok) {
      showToast(rule.enabled ? 'Flow paused' : 'Flow activated');
      await fetchRules();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this flow?')) return;
    await fetch(`/api/automation/${id}`, { method: 'DELETE' });
    showToast('Flow deleted');
    await fetchRules();
  }

  async function handleTrigger(rule: AutomationRule, reelUrl?: string) {
    setTriggeringId(rule.id);
    try {
      const body = reelUrl ? { reel_url: reelUrl } : {};
      const res = await fetch(`/api/automation/${rule.id}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Trigger failed');
      const posted = data.results?.filter((r: { status: string }) => r.status === 'posted').length ?? 0;
      showToast(
        data.processed > 0
          ? `Processed ${data.processed} reel(s) — ${posted} posted`
          : data.message || 'No new reels found'
      );
      setManualFormId(null);
      setManualUrl('');
      await fetchRules();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Trigger failed', 'error');
    } finally {
      setTriggeringId(null);
    }
  }

  const enabledCount = rules.filter((r) => r.rule.enabled).length;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Toast notification */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-[12px] text-sm font-medium animate-fade-in"
          style={{
            background: toast.type === 'success' ? 'rgba(52,211,153,0.10)' : 'rgba(239,68,68,0.10)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(52,211,153,0.20)' : 'rgba(239,68,68,0.20)'}`,
            color: toast.type === 'success' ? '#34d399' : '#f43f5e',
            backdropFilter: 'blur(16px)',
          }}
        >
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display text-[24px] font-bold tracking-tight" style={{ color: '#eaeaee' }}>
            Flows
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#5c5c6a' }}>
            Automate your content repurposing across platforms
          </p>
        </div>
        <NewFlowDialog accounts={accounts} onSave={handleCreate} />
      </div>

      {/* Gradient accent line */}
      <div className="gradient-accent mb-8" />

      {/* Stats strip */}
      <div
        className="glass-card rounded-[12px] px-5 py-3 flex items-center gap-6 mb-8 text-xs"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full pulse-dot"
            style={{ background: enabledCount > 0 ? '#34d399' : '#333' }}
          />
          <span style={{ color: '#5c5c6a' }}>
            <span style={{ color: '#eaeaee', fontWeight: 600 }}>{enabledCount}</span> active flow{enabledCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ width: 1, height: 16, background: '#1a1a22' }} />
        <span style={{ color: '#5c5c6a' }}>
          <span style={{ color: '#eaeaee', fontWeight: 600 }}>{rules.length}</span> total
        </span>
        <div style={{ width: 1, height: 16, background: '#1a1a22' }} />
        <span style={{ color: '#5c5c6a' }}>
          Polling every <span style={{ color: '#2dd4bf', fontWeight: 600 }}>15 min</span>
        </span>
      </div>

      {/* Flows list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-[16px] shimmer" style={{ border: '1px solid #1a1a22' }} />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div
          className="glass-card gradient-border rounded-[16px] p-16 text-center"
        >
          <div
            className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.12)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="8" width="7" height="8" rx="2" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.6" />
              <rect x="15" y="8" width="7" height="8" rx="2" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.6" />
              <path d="M9 12h6M12 10l2 2-2 2" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-[17px] mb-2" style={{ color: '#eaeaee' }}>
            Automate your repurposing
          </h3>
          <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: '#444450' }}>
            Create your first flow to automatically cross-post new Instagram Reels to YouTube, TikTok, and more
          </p>
          <NewFlowDialog accounts={accounts} onSave={handleCreate} />
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {rules.map(({ rule, account }) => (
            <div
              key={rule.id}
              className="glass-card gradient-border rounded-[16px] p-5 transition-all duration-200"
            >
              {/* Flow header: source → pipe → destinations + toggle */}
              <div className="flex items-center gap-4">
                {/* Source */}
                <div className="flex items-center gap-2.5">
                  <PlatformIcon platform={rule.source_platform} size={32} />
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: '#eaeaee' }}>
                      {account?.name ?? 'Unknown'}
                    </div>
                    <div className="text-[11px] font-mono" style={{ color: '#555' }}>
                      @{account?.username ?? '?'}
                    </div>
                  </div>
                </div>

                {/* Animated flow pipe */}
                <div className="flex items-center gap-2 flex-1 min-w-[60px]">
                  <div className={`flex-1 rounded-full ${rule.enabled ? 'flow-pipe' : 'flow-pipe-off'}`} />
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: rule.enabled ? 1 : 0.3 }}>
                    <path d="M4 8h8M9 5l3 3-3 3" stroke="#2dd4bf" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Destinations */}
                <div className="flex items-center gap-1.5">
                  {(rule.target_platforms as string[]).map((p) => (
                    <PlatformIcon key={p} platform={p} size={32} />
                  ))}
                </div>

                {/* Toggle + status */}
                <div className="flex flex-col items-center gap-1 ml-3">
                  <button
                    onClick={() => handleToggle(rule)}
                    className={`toggle-track ${rule.enabled ? 'on' : 'off'}`}
                    title={rule.enabled ? 'Pause flow' : 'Activate flow'}
                  >
                    <div className="toggle-thumb" />
                  </button>
                  <span
                    className="text-[9px] uppercase tracking-wider font-semibold"
                    style={{ color: rule.enabled ? '#34d399' : '#333340' }}
                  >
                    {rule.enabled ? 'Live' : 'Off'}
                  </span>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-5 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <div className="text-[9px] uppercase tracking-wider mb-0.5 font-medium" style={{ color: '#333340' }}>
                    Last Checked
                  </div>
                  <div className="text-[11px] font-mono" style={{ color: '#5c5c6a' }}>
                    {fmtDate(rule.last_checked_at)}
                  </div>
                </div>
                {rule.last_reel_id && (
                  <div>
                    <div className="text-[9px] uppercase tracking-wider mb-0.5 font-medium" style={{ color: '#333340' }}>
                      Last Reel
                    </div>
                    <div className="text-[11px] font-mono truncate max-w-[120px]" style={{ color: '#5c5c6a' }}>
                      {rule.last_reel_id}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[9px] uppercase tracking-wider mb-0.5 font-medium" style={{ color: '#333340' }}>
                    Route
                  </div>
                  <div className="text-[11px]" style={{ color: '#5c5c6a' }}>
                    IG → {(rule.target_platforms as string[]).map((p) => PLATFORM_LABELS[p] ?? p).join(' + ')}
                  </div>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTrigger(rule)}
                    disabled={triggeringId === rule.id}
                    className="px-3.5 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-200 disabled:opacity-30"
                    style={{
                      background: 'rgba(45,212,191,0.06)',
                      color: '#2dd4bf',
                      border: '1px solid rgba(45,212,191,0.12)',
                    }}
                  >
                    {triggeringId === rule.id ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        Checking…
                      </span>
                    ) : (
                      'Check Now'
                    )}
                  </button>
                  <button
                    onClick={() => setManualFormId(manualFormId === rule.id ? null : rule.id)}
                    className="px-3.5 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-200"
                    style={{
                      background: 'rgba(52,211,153,0.04)',
                      color: '#34d399',
                      border: '1px solid rgba(52,211,153,0.10)',
                    }}
                  >
                    Post URL
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="w-7 h-7 rounded-[8px] flex items-center justify-center transition-all duration-200"
                    style={{ color: '#333340', border: '1px solid #1a1a22' }}
                    title="Delete flow"
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2 3.5h10M5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M5.5 6v5M8.5 6v5M3.5 3.5l.5 8.5h6l.5-8.5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Manual URL form */}
              {manualFormId === rule.id && (
                <div className="mt-3 pt-3 animate-fade-in" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <p className="text-[11px] mb-2" style={{ color: '#555' }}>
                    Paste an Instagram Reel URL to manually crosspost:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      placeholder="https://www.instagram.com/reel/..."
                      className="flex-1 px-3 py-2 rounded-[8px] text-xs focus:outline-none"
                      style={{ background: '#08080c', border: '1px solid #1a1a22', color: '#eaeaee' }}
                    />
                    <button
                      onClick={() => manualUrl && handleTrigger(rule, manualUrl)}
                      disabled={!manualUrl || triggeringId === rule.id}
                      className="px-4 py-2 rounded-[8px] text-xs font-medium disabled:opacity-30"
                      style={{
                        background: 'rgba(52,211,153,0.08)',
                        color: '#34d399',
                        border: '1px solid rgba(52,211,153,0.15)',
                      }}
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

      {/* Info strip */}
      <div
        className="glass-card mt-8 rounded-[12px] px-4 py-3 flex items-center gap-3 text-xs"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
          <circle cx="7" cy="7" r="6" stroke="#444450" strokeWidth="1.3" />
          <path d="M7 6v4M7 4.5h.01" stroke="#444450" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <span style={{ color: '#444450' }}>
          Flows poll for new Instagram Reels every 15 minutes. Toggle a flow ON to activate real-time automation, or use
          &ldquo;Check Now&rdquo; to trigger manually.
        </span>
      </div>
    </div>
  );
}
