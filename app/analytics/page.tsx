'use client';

import { useState, useEffect, useCallback } from 'react';

interface Account {
  id: number;
  name: string;
  username: string;
  color: string;
  platforms: string[];
}

interface PlatformData {
  followers: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach_timeseries: { date: string; value: number }[];
  metric_type: string;
}

interface AnalyticsData {
  platforms: Record<string, PlatformData>;
  total_impressions: number;
  summary: {
    totalFollowers: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
  };
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

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function generateSparklinePath(
  data: { value: number }[],
  width: number,
  height: number
): { linePath: string; areaPath: string } {
  if (!data || data.length < 2) {
    return {
      linePath: `M 0,${height / 2} L ${width},${height / 2}`,
      areaPath: `M 0,${height / 2} L ${width},${height / 2} L ${width},${height} L 0,${height} Z`,
    };
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 4;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - pad - ((d.value - min) / range) * (height - pad * 2),
  }));

  const lineCoords = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${lineCoords} L ${width},${height} L 0,${height} Z`;

  return { linePath: lineCoords, areaPath };
}

function Sparkline({
  data,
  color,
  width = 120,
  height = 40,
}: {
  data: { value: number }[];
  color: string;
  width?: number;
  height?: number;
}) {
  const id = `spark-${color.replace('#', '')}-${width}`;
  const { linePath, areaPath } = generateSparklinePath(data, width, height);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${id})`} />
      <path d={linePath} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendArrow({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[11px] font-medium"
      style={{ color: positive ? '#34d399' : '#ef4444' }}
    >
      {positive ? '↑' : '↓'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export default function AnalyticsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then((accs: Account[]) => {
        if (Array.isArray(accs) && accs.length > 0) {
          setAccounts(accs);
          setSelectedAccountId(accs[0].id);
        }
      })
      .catch(() => setError('Failed to load accounts'));
  }, []);

  const fetchAnalytics = useCallback(async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/analytics?accountId=${selectedAccountId}&platforms=all&timeRange=${timeRange}`
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
    } catch {
      setError('Failed to load analytics. Check your API key and connection.');
      // Use mock data for display
      setData(generateMockData());
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  function generateMockData(): AnalyticsData {
    const makeTimeseries = (base: number) =>
      Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
        value: Math.round(base + Math.sin(i * 0.4) * base * 0.3 + Math.random() * base * 0.1),
      }));

    return {
      platforms: {
        youtube: {
          followers: 12400,
          views: 284000,
          likes: 9200,
          comments: 1840,
          shares: 620,
          saves: 3100,
          reach_timeseries: makeTimeseries(8500),
          metric_type: 'views',
        },
        tiktok: {
          followers: 45200,
          views: 1240000,
          likes: 87000,
          comments: 4300,
          shares: 12000,
          saves: 19000,
          reach_timeseries: makeTimeseries(40000),
          metric_type: 'views',
        },
        instagram: {
          followers: 8900,
          views: 74000,
          likes: 6200,
          comments: 890,
          shares: 420,
          saves: 2100,
          reach_timeseries: makeTimeseries(2400),
          metric_type: 'reach',
        },
      },
      total_impressions: 1598000,
      summary: {
        totalFollowers: 66500,
        totalViews: 1598000,
        totalLikes: 102400,
        totalComments: 7030,
      },
    };
  }

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Platform tabs derived from connected platforms
  const platformTabs = selectedAccount
    ? ['all', ...(selectedAccount.platforms as string[])]
    : ['all'];

  // Filter platform data by active tab
  const platformsToShow =
    activePlatformTab === 'all'
      ? Object.keys(data?.platforms ?? {})
      : [activePlatformTab];

  const visiblePlatforms = platformsToShow.filter((p) => data?.platforms[p]);

  // YouTube specific data
  const ytData = data?.platforms['youtube'];

  // Summary metric cards
  const metricCards = [
    {
      label: 'Total Views',
      value: data?.summary.totalViews ?? 0,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 7s2.5-4.5 6-4.5S13 7 13 7s-2.5 4.5-6 4.5S1 7 1 7z" stroke="#a78bfa" strokeWidth="1.3" />
          <circle cx="7" cy="7" r="2" stroke="#a78bfa" strokeWidth="1.3" />
        </svg>
      ),
      color: '#a78bfa',
      trend: 12.4,
    },
    {
      label: 'Total Followers',
      value: data?.summary.totalFollowers ?? 0,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="5" r="2.5" stroke="#f472b6" strokeWidth="1.3" />
          <path d="M2 13c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" stroke="#f472b6" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ),
      color: '#f472b6',
      trend: 8.1,
    },
    {
      label: 'Total Likes',
      value: data?.summary.totalLikes ?? 0,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 12S2 8.5 2 5.5a3 3 0 015-2.24A3 3 0 0112 5.5C12 8.5 7 12 7 12z" stroke="#34d399" strokeWidth="1.3" />
        </svg>
      ),
      color: '#34d399',
      trend: 5.7,
    },
    {
      label: 'Comments',
      value: data?.summary.totalComments ?? 0,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="9" rx="2" stroke="#fb923c" strokeWidth="1.3" />
          <path d="M4 13l3-3H1l3 3z" stroke="#fb923c" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      ),
      color: '#fb923c',
      trend: -2.3,
    },
    {
      label: 'Total Shares',
      value: Object.values(data?.platforms ?? {}).reduce((s, p) => s + p.shares, 0),
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="11" cy="3" r="1.5" stroke="#60a5fa" strokeWidth="1.3" />
          <circle cx="11" cy="11" r="1.5" stroke="#60a5fa" strokeWidth="1.3" />
          <circle cx="3" cy="7" r="1.5" stroke="#60a5fa" strokeWidth="1.3" />
          <path d="M4.5 7.5L9.5 11M4.5 6.5L9.5 3" stroke="#60a5fa" strokeWidth="1.3" />
        </svg>
      ),
      color: '#60a5fa',
      trend: 18.2,
    },
    {
      label: 'Total Impressions',
      value: data?.total_impressions ?? 0,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 10l3-4 2.5 2L10 5l2 3" stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      color: '#a78bfa',
      trend: 22.5,
    },
  ];

  const inputBg = {
    background: '#111111',
    border: '1px solid #1e1e1e',
    color: '#f5f5f5',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight" style={{ color: '#f5f5f5' }}>
            Analytics
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#6b6b6b' }}>
            Performance metrics across all platforms
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Account selector */}
          <select
            value={selectedAccountId ?? ''}
            onChange={(e) => setSelectedAccountId(Number(e.target.value))}
            style={inputBg}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Time range */}
          <div
            className="flex rounded-[10px] overflow-hidden"
            style={{ border: '1px solid #1e1e1e', background: '#111111' }}
          >
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className="px-3 py-2 text-xs font-medium transition-all"
                style={{
                  background: timeRange === r ? 'rgba(167,139,250,0.12)' : 'transparent',
                  color: timeRange === r ? '#a78bfa' : '#4a4a4a',
                  borderRight: r !== '90d' ? '1px solid #1e1e1e' : 'none',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="flex items-center gap-1.5 mb-6">
        {platformTabs.map((tab) => {
          const isActive = activePlatformTab === tab;
          const color = tab === 'all' ? '#a78bfa' : (PLATFORM_COLORS[tab] ?? '#888');
          return (
            <button
              key={tab}
              onClick={() => setActivePlatformTab(tab)}
              className="px-3 py-1.5 text-xs font-medium rounded-[8px] transition-all duration-150"
              style={{
                background: isActive ? `${color}15` : 'transparent',
                color: isActive ? color : '#4a4a4a',
                border: `1px solid ${isActive ? `${color}30` : '#1a1a1a'}`,
              }}
            >
              {tab === 'all' ? 'All Platforms' : (PLATFORM_LABELS[tab] ?? tab)}
            </button>
          );
        })}
      </div>

      {error && (
        <div
          className="rounded-[10px] px-4 py-3 mb-5 text-xs"
          style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)', color: '#fb923c' }}
        >
          {error} — showing demo data
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-[14px] shimmer"
              style={{ height: '96px', border: '1px solid #1a1a1a' }}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {metricCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[14px] p-5 stat-card transition-all duration-200"
                style={{ background: '#111111', border: '1px solid #1e1e1e' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-7 h-7 rounded-[8px] flex items-center justify-center"
                    style={{ background: `${card.color}12`, border: `1px solid ${card.color}20` }}
                  >
                    {card.icon}
                  </div>
                  <TrendArrow value={card.trend} />
                </div>
                <div className="text-[26px] font-bold font-mono tabular-nums leading-none mb-1" style={{ color: '#f5f5f5' }}>
                  {fmt(card.value)}
                </div>
                <div className="text-[11px] uppercase tracking-widest" style={{ color: '#4a4a4a' }}>
                  {card.label}
                </div>
              </div>
            ))}
          </div>

          {/* YouTube section */}
          {ytData && (activePlatformTab === 'all' || activePlatformTab === 'youtube') && (
            <div
              className="rounded-[14px] p-6 mb-6"
              style={{ background: '#111111', border: '1px solid #1e1e1e' }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div
                  className="w-6 h-6 rounded-[6px] flex items-center justify-center"
                  style={{ background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.2)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="#ff4444">
                    <path d="M10.8 3.2S10.6 2.1 10 1.5c-.6-.6-1.3-.7-1.6-.7C7 .7 5 .7 5 .7S3 .7 1.6.8C1.3.8.6.9 0 1.5-.6 2.1-.8 3.2-.8 3.2S-1 4.5-1 5.8v1.2c0 1.3.2 2.6.2 2.6S.4 10.7 1 11.3c.6.6 1.5.6 1.9.7C4.3 12.1 6 12.1 6 12.1s2 0 3.4-.1c.3 0 1-.1 1.6-.7s.8-1.7.8-1.7.2-1.3.2-2.6V5.8c0-1.3-.2-2.6-.2-2.6zM4.5 8.1V3.9l4 2.1-4 2.1z" />
                  </svg>
                </div>
                <h3 className="font-display font-semibold text-[13px]" style={{ color: '#f5f5f5' }}>
                  YouTube Insights
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  {
                    label: 'Subscribers',
                    value: fmt(ytData.followers),
                    color: '#ff4444',
                    trend: '+2.1K this month',
                  },
                  {
                    label: 'Total Views',
                    value: fmt(ytData.views),
                    color: '#fb923c',
                    trend: 'All time',
                  },
                  {
                    label: 'Engagement Rate',
                    value: ytData.views > 0
                      ? `${(((ytData.likes + ytData.comments) / ytData.views) * 100).toFixed(2)}%`
                      : '—',
                    color: '#34d399',
                    trend: '(likes+comments)/views',
                  },
                  {
                    label: 'Avg Likes',
                    value: fmt(ytData.likes),
                    color: '#f472b6',
                    trend: 'Per video estimate',
                  },
                  {
                    label: 'Comments',
                    value: fmt(ytData.comments),
                    color: '#60a5fa',
                    trend: 'Total engagement',
                  },
                  {
                    label: 'Saves',
                    value: fmt(ytData.saves),
                    color: '#a78bfa',
                    trend: 'Playlist adds',
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-[20px] font-bold font-mono tabular-nums" style={{ color: item.color }}>
                      {item.value}
                    </div>
                    <div className="text-[11px] font-medium mt-0.5" style={{ color: '#f5f5f5' }}>
                      {item.label}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: '#4a4a4a' }}>
                      {item.trend}
                    </div>
                  </div>
                ))}
              </div>

              {ytData.reach_timeseries?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#333' }}>
                    Views over time
                  </div>
                  <Sparkline
                    data={ytData.reach_timeseries}
                    color="#ff4444"
                    width={560}
                    height={60}
                  />
                </div>
              )}
            </div>
          )}

          {/* Per-platform sparklines */}
          {visiblePlatforms.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {visiblePlatforms.map((platform) => {
                const pData = data?.platforms[platform];
                if (!pData) return null;
                const color = PLATFORM_COLORS[platform] ?? '#888';
                const engRate = pData.views > 0
                  ? (((pData.likes + pData.comments) / pData.views) * 100).toFixed(2)
                  : '0.00';

                return (
                  <div
                    key={platform}
                    className="rounded-[14px] p-5"
                    style={{
                      background: '#111111',
                      border: '1px solid #1e1e1e',
                      borderLeft: `3px solid ${color}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[12px] font-semibold" style={{ color }}>
                        {PLATFORM_LABELS[platform] ?? platform}
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: '#333' }}>
                        {engRate}% eng.
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: 'Followers', value: pData.followers },
                        { label: 'Views', value: pData.views },
                        { label: 'Likes', value: pData.likes },
                      ].map((m) => (
                        <div key={m.label}>
                          <div className="text-[16px] font-bold font-mono tabular-nums" style={{ color: '#f5f5f5' }}>
                            {fmt(m.value)}
                          </div>
                          <div className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: '#4a4a4a' }}>
                            {m.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {pData.reach_timeseries?.length > 0 ? (
                      <Sparkline data={pData.reach_timeseries} color={color} width={240} height={40} />
                    ) : (
                      <div
                        className="h-10 rounded-lg flex items-center justify-center text-[11px]"
                        style={{ background: '#0d0d0d', color: '#333' }}
                      >
                        No timeseries data
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Platform breakdown table */}
          {data && Object.keys(data.platforms).length > 0 && (
            <div
              className="rounded-[14px] overflow-hidden"
              style={{ background: '#111111', border: '1px solid #1e1e1e' }}
            >
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #181818' }}>
                <h3 className="font-display font-semibold text-[13px]" style={{ color: '#f5f5f5' }}>
                  Platform Breakdown
                </h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #181818' }}>
                    {['Platform', 'Followers', 'Views', 'Likes', 'Eng. Rate', 'Comments', 'Shares'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[10px] uppercase tracking-[0.12em] font-medium px-4 py-3 first:pl-5"
                        style={{ color: '#333' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.platforms).map(([platform, pData], idx, arr) => {
                    const color = PLATFORM_COLORS[platform] ?? '#888';
                    const engRate = pData.views > 0
                      ? (((pData.likes + pData.comments) / pData.views) * 100).toFixed(2)
                      : '0.00';
                    return (
                      <tr
                        key={platform}
                        style={{ borderBottom: idx < arr.length - 1 ? '1px solid #0f0f0f' : 'none' }}
                      >
                        <td className="px-4 py-3.5 pl-5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-1.5 h-5 rounded-full"
                              style={{ background: color }}
                            />
                            <span className="text-sm font-medium" style={{ color: '#f5f5f5' }}>
                              {PLATFORM_LABELS[platform] ?? platform}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-mono tabular-nums" style={{ color: '#f5f5f5' }}>{fmt(pData.followers)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-mono tabular-nums" style={{ color: '#f5f5f5' }}>{fmt(pData.views)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-mono tabular-nums" style={{ color: '#f5f5f5' }}>{fmt(pData.likes)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="text-[11px] font-medium px-2 py-0.5 rounded-[6px]"
                            style={{
                              color: parseFloat(engRate) > 3 ? '#34d399' : '#f5f5f5',
                              background: parseFloat(engRate) > 3 ? 'rgba(52,211,153,0.08)' : 'transparent',
                            }}
                          >
                            {engRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-mono tabular-nums" style={{ color: '#6b6b6b' }}>{fmt(pData.comments)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-mono tabular-nums" style={{ color: '#6b6b6b' }}>{fmt(pData.shares)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!data && !loading && (
            <div
              className="rounded-[14px] p-14 text-center"
              style={{ background: '#111111', border: '1px dashed #1e1e1e' }}
            >
              <p className="text-sm" style={{ color: '#4a4a4a' }}>
                No analytics data available. Connect an account to get started.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
