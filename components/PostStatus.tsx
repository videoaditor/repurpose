'use client';

export interface PlatformStatus {
  platform: string;
  status: 'pending' | 'posting' | 'success' | 'error';
  message?: string;
}

interface PostStatusProps {
  statuses: PlatformStatus[];
}

const platformLabels: Record<string, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube',
  instagram: 'Instagram',
  x: 'X',
  linkedin: 'LinkedIn',
};

const platformColors: Record<string, string> = {
  tiktok: '#fe2c55',
  youtube: '#ff0000',
  instagram: '#c13584',
  x: '#e7e7e7',
  linkedin: '#0077b5',
};

export default function PostStatus({ statuses }: PostStatusProps) {
  const allDone = statuses.every((s) => s.status === 'success' || s.status === 'error');
  const successCount = statuses.filter((s) => s.status === 'success').length;

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display font-semibold text-white text-sm">Publishing Status</h3>
        {allDone && (
          <span className="text-xs text-[#888]">
            {successCount}/{statuses.length} posted
          </span>
        )}
      </div>

      {statuses.map((item) => (
        <div key={item.platform} className="flex items-center gap-3">
          {/* Platform indicator */}
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: platformColors[item.platform] ?? '#888' }}
          />

          {/* Label */}
          <span className="text-sm text-[#ccc] flex-1 font-medium">
            {platformLabels[item.platform] ?? item.platform}
          </span>

          {/* Status icon */}
          <div className="flex items-center gap-1.5">
            {item.status === 'pending' && (
              <span className="text-[#555] text-xs">Waiting</span>
            )}
            {item.status === 'posting' && (
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[#888] text-xs">Posting...</span>
              </div>
            )}
            {item.status === 'success' && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-emerald-400 text-xs">Posted</span>
              </div>
            )}
            {item.status === 'error' && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M3 3l4 4M7 3l-4 4" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-red-400 text-xs">{item.message ?? 'Failed'}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
