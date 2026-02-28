'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface FlowDef {
  id: number;
  source: string;
  destinations: string[];
  trigger: string;
  enabled: boolean;
  lastRun: string | null;
  createdAt: string;
}

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

const SOURCE_OPTIONS = ['youtube', 'tiktok', 'instagram'];
const DEST_OPTIONS = ['tiktok', 'youtube', 'instagram', 'x', 'linkedin'];

function PlatformIcon({ platform }: { platform: string }) {
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
      className="w-7 h-7 rounded-[8px] flex items-center justify-center"
      style={{ background: `${color}12`, border: `1px solid ${color}25` }}
    >
      {icons[platform] ?? <span style={{ fontSize: 10, color }}>{platform[0].toUpperCase()}</span>}
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="relative w-10 h-5 rounded-full transition-all duration-200 flex-shrink-0"
      style={{
        background: enabled ? 'rgba(167,139,250,0.3)' : '#1e1e1e',
        border: `1px solid ${enabled ? 'rgba(167,139,250,0.4)' : '#2a2a2a'}`,
      }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
        style={{
          background: enabled ? '#a78bfa' : '#333',
          left: enabled ? 'calc(100% - 18px)' : '2px',
          boxShadow: enabled ? '0 0 8px rgba(167,139,250,0.4)' : 'none',
        }}
      />
    </button>
  );
}

function NewFlowDialog({ onSave }: { onSave: (flow: Partial<FlowDef>) => void }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState('youtube');
  const [destinations, setDestinations] = useState<string[]>(['tiktok', 'instagram']);
  const [aiCaptions, setAiCaptions] = useState(true);
  const [toast, setToast] = useState(false);

  function toggleDest(p: string) {
    setDestinations((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function handleSave() {
    onSave({ source, destinations, trigger: 'On new post', enabled: true });
    setOpen(false);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  }

  const selectStyle = {
    background: '#0d0d0d',
    border: '1px solid #1e1e1e',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#f5f5f5',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  };

  return (
    <>
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-[10px] text-sm font-medium animate-fade-in"
          style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}
        >
          ✓ Flow saved
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[10px] transition-all"
            style={{
              background: 'rgba(167,139,250,0.12)',
              color: '#a78bfa',
              border: '1px solid rgba(167,139,250,0.2)',
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
          style={{ background: '#111111', border: '1px solid #1e1e1e', borderRadius: '14px', color: '#f5f5f5' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: '#f5f5f5', fontSize: '15px' }}>Create New Flow</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Source */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b6b6b' }}>Source Platform</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                style={selectStyle}
              >
                {SOURCE_OPTIONS.map((p) => (
                  <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                ))}
              </select>
            </div>

            {/* Destinations */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#6b6b6b' }}>Destinations</label>
              <div className="space-y-1.5">
                {DEST_OPTIONS.filter((p) => p !== source).map((p) => {
                  const checked = destinations.includes(p);
                  return (
                    <label
                      key={p}
                      className="flex items-center gap-3 p-2.5 rounded-[10px] cursor-pointer transition-all"
                      style={{
                        border: `1px solid ${checked ? 'rgba(167,139,250,0.2)' : '#181818'}`,
                        background: checked ? 'rgba(167,139,250,0.04)' : 'transparent',
                      }}
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggleDest(p)} className="sr-only" />
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{
                          background: checked ? '#a78bfa' : 'transparent',
                          border: `1px solid ${checked ? '#a78bfa' : '#2a2a2a'}`,
                        }}
                      >
                        {checked && (
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm" style={{ color: checked ? '#f5f5f5' : '#6b6b6b' }}>
                        {PLATFORM_LABELS[p]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Trigger */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b6b6b' }}>Trigger</label>
              <div
                className="px-3 py-2.5 rounded-[10px] text-sm"
                style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', color: '#6b6b6b' }}
              >
                On new post
              </div>
            </div>

            {/* AI Captions toggle */}
            <div
              className="flex items-center justify-between p-3 rounded-[10px]"
              style={{ background: '#0d0d0d', border: '1px solid #1e1e1e' }}
            >
              <div>
                <div className="text-sm font-medium" style={{ color: '#f5f5f5' }}>AI Captions</div>
                <div className="text-xs mt-0.5" style={{ color: '#4a4a4a' }}>Auto-generate platform captions</div>
              </div>
              <Toggle enabled={aiCaptions} onChange={setAiCaptions} />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={destinations.length === 0}
              className="w-full py-2.5 text-sm font-medium rounded-[10px] transition-all"
              style={{
                background: destinations.length === 0 ? '#141414' : 'rgba(167,139,250,0.12)',
                color: destinations.length === 0 ? '#333' : '#a78bfa',
                border: `1px solid ${destinations.length === 0 ? '#1e1e1e' : 'rgba(167,139,250,0.2)'}`,
                cursor: destinations.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Save Flow
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const EXAMPLE_FLOW: FlowDef = {
  id: 1,
  source: 'youtube',
  destinations: ['tiktok', 'instagram'],
  trigger: 'New video published',
  enabled: true,
  lastRun: '2 hours ago',
  createdAt: '2026-02-15',
};

export default function FlowsPage() {
  const [flows, setFlows] = useState<FlowDef[]>([EXAMPLE_FLOW]);

  function addFlow(partial: Partial<FlowDef>) {
    const newFlow: FlowDef = {
      id: Date.now(),
      source: partial.source ?? 'youtube',
      destinations: partial.destinations ?? [],
      trigger: partial.trigger ?? 'On new post',
      enabled: partial.enabled ?? true,
      lastRun: null,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setFlows((prev) => [...prev, newFlow]);
  }

  function toggleFlow(id: number) {
    setFlows((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  }

  function deleteFlow(id: number) {
    setFlows((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight" style={{ color: '#f5f5f5' }}>
            Flows
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#6b6b6b' }}>
            Automate your content repurposing
          </p>
        </div>
        <NewFlowDialog onSave={addFlow} />
      </div>

      {/* Flows list */}
      {flows.length === 0 ? (
        <div
          className="rounded-[14px] p-16 text-center"
          style={{ background: '#111111', border: '1px dashed #1e1e1e' }}
        >
          <div
            className="w-14 h-14 rounded-[14px] flex items-center justify-center mx-auto mb-5"
            style={{ background: '#181818', border: '1px solid #1e1e1e' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="8" width="7" height="8" rx="2" stroke="#2a2a2a" strokeWidth="1.5" />
              <rect x="15" y="8" width="7" height="8" rx="2" stroke="#2a2a2a" strokeWidth="1.5" />
              <path d="M9 12h6M12 10l2 2-2 2" stroke="#2a2a2a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="font-display font-semibold text-[15px] mb-2" style={{ color: '#f5f5f5' }}>
            Automate your repurposing
          </h3>
          <p className="text-sm mb-6" style={{ color: '#4a4a4a' }}>
            Create your first flow to automatically cross-post content
          </p>
          <NewFlowDialog onSave={addFlow} />
        </div>
      ) : (
        <div className="space-y-3">
          {flows.map((flow) => (
            <div
              key={flow.id}
              className="rounded-[14px] p-5 transition-all duration-200 card-hover"
              style={{ background: '#111111', border: '1px solid #1e1e1e' }}
            >
              <div className="flex items-center gap-4">
                {/* Source → Destinations */}
                <div className="flex items-center gap-3 flex-1">
                  {/* Source */}
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={flow.source} />
                    <span className="text-[13px] font-medium" style={{ color: '#f5f5f5' }}>
                      {PLATFORM_LABELS[flow.source] ?? flow.source}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-2 px-2">
                    <div className="h-px flex-1 min-w-[24px]" style={{ background: 'linear-gradient(to right, #2a2a2a, #a78bfa50)' }} />
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7h8M8 4l3 3-3 3" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* Destinations */}
                  <div className="flex items-center gap-1.5">
                    {flow.destinations.map((dest) => (
                      <PlatformIcon key={dest} platform={dest} />
                    ))}
                    <span className="text-[12px] ml-1" style={{ color: '#6b6b6b' }}>
                      {flow.destinations.map((d) => PLATFORM_LABELS[d] ?? d).join(' + ')}
                    </span>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-5">
                  <div>
                    <div className="text-[11px] font-medium" style={{ color: '#f5f5f5' }}>
                      {flow.trigger}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: '#4a4a4a' }}>
                      {flow.lastRun ? `Last run: ${flow.lastRun}` : 'Never run'}
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex flex-col items-center gap-1">
                    <Toggle enabled={flow.enabled} onChange={() => toggleFlow(flow.id)} />
                    <span className="text-[9px] uppercase tracking-wider" style={{ color: flow.enabled ? '#34d399' : '#333' }}>
                      {flow.enabled ? 'On' : 'Off'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1.5 rounded-[8px] transition-all"
                      style={{ background: 'transparent', color: '#333' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6b6b6b'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#333'; }}
                      title="Edit"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteFlow(flow.id)}
                      className="p-1.5 rounded-[8px] transition-all"
                      style={{ background: 'transparent', color: '#333' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#333'; }}
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5.5 6v4M8.5 6v4M3 3.5l.7 7.5a.5.5 0 00.5.5h5.6a.5.5 0 00.5-.5l.7-7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info strip */}
      <div
        className="mt-6 rounded-[10px] px-4 py-3 flex items-center gap-3 text-xs"
        style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
          <circle cx="7" cy="7" r="6" stroke="#4a4a4a" strokeWidth="1.3" />
          <path d="M7 6v4M7 4.5h.01" stroke="#4a4a4a" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <span style={{ color: '#4a4a4a' }}>
          Flows automatically cross-post new content. Full automation backend coming soon — flows are saved locally for now.
        </span>
      </div>
    </div>
  );
}
