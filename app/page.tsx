import { db } from '@/lib/db';
import { accounts, posts } from '@/drizzle/schema';
import { desc } from 'drizzle-orm';
import AccountCard from '@/components/AccountCard';
import PlatformBadge from '@/components/PlatformBadge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    posted: { label: 'Posted', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
    scheduled: { label: 'Scheduled', color: '#fb923c', bg: 'rgba(251,146,60,0.08)' },
    failed: { label: 'Failed', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
    pending: { label: 'Pending', color: '#6b6b6b', bg: 'rgba(107,107,107,0.08)' },
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

// Static sparkline SVG — just a decorative line
function Sparkline({ color = '#a78bfa' }: { color?: string }) {
  const pts = [8, 14, 10, 6, 12, 4, 9, 7, 5, 3, 8, 5, 6, 2, 4, 6];
  const w = 80;
  const h = 28;
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const range = max - min || 1;
  const coords = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const line = coords.join(' L ');
  const area = `M ${coords[0]} L ${line} L ${w},${h} L 0,${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace('#', '')})`} />
      <path d={`M ${line}`} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function Dashboard() {
  const allAccounts = await db.select().from(accounts).orderBy(desc(accounts.created_at));
  const recentPosts = await db.select().from(posts).orderBy(desc(posts.created_at)).limit(10);

  const postCountMap: Record<number, number> = {};
  for (const post of recentPosts) {
    postCountMap[post.account_id] = (postCountMap[post.account_id] ?? 0) + 1;
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const postsThisWeek = recentPosts.filter((p) => new Date(p.created_at) >= weekAgo).length;

  const activePlatforms = new Set<string>();
  for (const acc of allAccounts) {
    (acc.platforms as string[]).forEach((p) => activePlatforms.add(p));
  }

  const accountMap = Object.fromEntries(allAccounts.map((a) => [a.id, a]));

  const heroStats = [
    { label: 'Accounts', value: allAccounts.length, sub: 'connected', color: '#a78bfa' },
    { label: 'Posts This Week', value: postsThisWeek, sub: 'published', color: '#f472b6' },
    { label: 'Platforms Active', value: activePlatforms.size, sub: 'channels', color: '#34d399' },
    { label: 'Total Posts', value: recentPosts.length, sub: 'all time', color: '#fb923c' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight" style={{ color: '#f5f5f5' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#6b6b6b' }}>
            Manage and distribute your content
          </p>
        </div>
        <Link
          href="/post"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[10px] transition-all duration-150"
          style={{
            background: 'rgba(167,139,250,0.12)',
            color: '#a78bfa',
            border: '1px solid rgba(167,139,250,0.2)',
          }}
          onMouseEnter={() => {}}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          New Post
        </Link>
      </div>

      {/* Hero stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {heroStats.map((stat) => (
          <div
            key={stat.label}
            className="stat-card rounded-[14px] p-5 transition-all duration-200"
            style={{
              background: '#111111',
              border: '1px solid #1e1e1e',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div
                  className="text-[28px] font-bold font-mono leading-none tabular-nums"
                  style={{ color: '#f5f5f5' }}
                >
                  {stat.value}
                </div>
                <div className="text-[11px] mt-1.5 uppercase tracking-widest font-medium" style={{ color: '#6b6b6b' }}>
                  {stat.label}
                </div>
              </div>
            </div>
            <Sparkline color={stat.color} />
          </div>
        ))}
      </div>

      {/* Accounts grid */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-[10px] uppercase tracking-[0.15em] font-semibold"
          style={{ color: '#333' }}
        >
          Accounts
        </h2>
        <Link href="/accounts" className="text-[11px] transition-colors" style={{ color: '#4a4a4a' }}>
          Manage →
        </Link>
      </div>

      {allAccounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {allAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              postCount={postCountMap[account.id] ?? 0}
            />
          ))}
        </div>
      ) : (
        <div
          className="rounded-[14px] p-10 text-center mb-10"
          style={{
            background: '#111111',
            border: '1px dashed #1e1e1e',
          }}
        >
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center mx-auto mb-3"
            style={{ background: '#181818' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="6" r="3.5" stroke="#333" strokeWidth="1.5" />
              <path d="M2 16c0-3.866 3.134-6 7-6s7 2.134 7 6" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm mb-2" style={{ color: '#4a4a4a' }}>No accounts connected.</p>
          <Link href="/accounts" className="text-sm transition-colors" style={{ color: '#a78bfa' }}>
            Add your first account →
          </Link>
        </div>
      )}

      {/* Recent posts */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-[10px] uppercase tracking-[0.15em] font-semibold"
          style={{ color: '#333' }}
        >
          Recent Posts
        </h2>
        <Link href="/history" className="text-[11px] transition-colors" style={{ color: '#4a4a4a' }}>
          View all →
        </Link>
      </div>

      {recentPosts.length > 0 ? (
        <div
          className="rounded-[14px] overflow-hidden overflow-x-auto"
          style={{
            background: '#111111',
            border: '1px solid #1e1e1e',
          }}
        >
          <table className="w-full min-w-[500px]">
            <thead>
              <tr style={{ borderBottom: '1px solid #181818' }}>
                {['Title', 'Account', 'Platforms', 'Status', 'Date'].map((h) => (
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
              {recentPosts.map((post, idx) => {
                const account = accountMap[post.account_id];
                return (
                  <tr
                    key={post.id}
                    className="transition-colors"
                    style={{
                      borderBottom: idx < recentPosts.length - 1 ? '1px solid #0f0f0f' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = '#0f0f0f';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                    }}
                  >
                    <td className="px-4 py-3.5 pl-5">
                      <span className="text-sm font-medium truncate max-w-[180px] block" style={{ color: '#f5f5f5' }}>
                        {post.title}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {account ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: account.color }}
                          >
                            {account.name[0].toUpperCase()}
                          </div>
                          <span className="text-xs" style={{ color: '#6b6b6b' }}>{account.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: '#333' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(post.platforms as string[]).slice(0, 3).map((p) => (
                          <PlatformBadge key={p} platform={p} size="sm" />
                        ))}
                        {(post.platforms as string[]).length > 3 && (
                          <span className="text-[10px]" style={{ color: '#4a4a4a' }}>
                            +{(post.platforms as string[]).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono tabular-nums" style={{ color: '#4a4a4a' }}>
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="rounded-[14px] p-10 text-center"
          style={{
            background: '#111111',
            border: '1px dashed #1e1e1e',
          }}
        >
          <p className="text-sm mb-2" style={{ color: '#4a4a4a' }}>No posts yet.</p>
          <Link href="/post" className="text-sm transition-colors" style={{ color: '#a78bfa' }}>
            Create your first post →
          </Link>
        </div>
      )}
    </div>
  );
}
