import { db } from '@/lib/db';
import { accounts, posts, automationRules } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import AccountCard from '@/components/AccountCard';
import PlatformBadge from '@/components/PlatformBadge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    posted: { label: 'Posted', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
    scheduled: { label: 'Scheduled', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    failed: { label: 'Failed', color: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
    pending: { label: 'Pending', color: '#5c5c6a', bg: 'rgba(92,92,106,0.08)' },
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

function Sparkline({ color = '#2dd4bf' }: { color?: string }) {
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

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function Dashboard() {
  const allAccounts = await db.select().from(accounts).orderBy(desc(accounts.created_at));
  const recentPosts = await db.select().from(posts).orderBy(desc(posts.created_at)).limit(10);

  // Load automation rules with account info
  const allRules = await db.select().from(automationRules).orderBy(desc(automationRules.created_at));
  const rulesWithAccounts = allRules.map((rule) => ({
    rule,
    account: allAccounts.find((a) => a.id === rule.account_id) ?? null,
  }));

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
  const enabledRules = allRules.filter((r) => r.enabled).length;

  const heroStats = [
    { label: 'Auto Rules', value: enabledRules, sub: 'active', color: '#2dd4bf' },
    { label: 'Posts This Week', value: postsThisWeek, sub: 'published', color: '#f472b6' },
    { label: 'Platforms Active', value: activePlatforms.size, sub: 'channels', color: '#f59e0b' },
    { label: 'Total Posts', value: recentPosts.length, sub: 'all time', color: '#818cf8' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display text-[24px] font-bold tracking-tight" style={{ color: '#eaeaee' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#5c5c6a' }}>
            Instagram → YouTube &amp; TikTok auto-crosspost
          </p>
        </div>
        <Link
          href="/flows"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[10px] transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(45,212,191,0.12), rgba(56,189,248,0.06))',
            color: '#2dd4bf',
            border: '1px solid rgba(45,212,191,0.18)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          New Flow
        </Link>
      </div>

      {/* Gradient accent line */}
      <div className="gradient-accent mb-8" />

      {/* Hero stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger-children">
        {heroStats.map((stat) => (
          <div
            key={stat.label}
            className="glass-card gradient-border stat-card rounded-[14px] p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div
                  className="text-[28px] font-bold font-mono leading-none tabular-nums"
                  style={{ color: '#eaeaee' }}
                >
                  {stat.value}
                </div>
                <div className="text-[11px] mt-1.5 uppercase tracking-widest font-medium" style={{ color: '#5c5c6a' }}>
                  {stat.label}
                </div>
              </div>
            </div>
            <Sparkline color={stat.color} />
          </div>
        ))}
      </div>

      {/* Automation Rules */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-label">
          Automation Flows
        </h2>
        <Link href="/flows" className="text-[11px] transition-colors" style={{ color: '#444450' }}>
          Manage →
        </Link>
      </div>

      {rulesWithAccounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {rulesWithAccounts.map(({ rule, account }) => (
            <div
              key={rule.id}
              className="glass-card gradient-border rounded-[14px] p-4"
            >
              <div className="flex items-center gap-2.5 mb-3">
                {account && (
                  <div
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: account.color, boxShadow: `0 0 8px ${account.color}40` }}
                  >
                    {account.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: '#eaeaee' }}>
                    {account?.name ?? 'Unknown'}
                  </div>
                  <div className="text-[11px] font-mono" style={{ color: '#444450' }}>
                    IG → {(rule.target_platforms as string[]).join(', ')}
                  </div>
                </div>
                <span
                  className="text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0"
                  style={
                    rule.enabled
                      ? { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }
                      : { background: 'rgba(92,92,106,0.1)', color: '#5c5c6a', border: '1px solid rgba(92,92,106,0.2)' }
                  }
                >
                  {rule.enabled ? 'ON' : 'OFF'}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mb-2.5">
                {(rule.target_platforms as string[]).map((p) => (
                  <PlatformBadge key={p} platform={p} size="sm" />
                ))}
              </div>

              <div className="text-[10px] font-mono" style={{ color: '#333340' }}>
                Checked {fmtDate(rule.last_checked_at)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="glass-card gradient-border rounded-[14px] p-10 text-center mb-10"
        >
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center mx-auto mb-3"
            style={{ background: '#14141a' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2v5M9 16v-5M2 9h5M16 9h-5" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
              <circle cx="9" cy="9" r="2.5" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.7" />
            </svg>
          </div>
          <p className="text-sm mb-2" style={{ color: '#444450' }}>No automation rules yet.</p>
          <Link href="/flows" className="text-sm transition-colors" style={{ color: '#2dd4bf' }}>
            Create your first flow →
          </Link>
        </div>
      )}

      {/* Accounts grid */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-label">
          Accounts
        </h2>
        <Link href="/accounts" className="text-[11px] transition-colors" style={{ color: '#444450' }}>
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
          className="glass-card gradient-border rounded-[14px] p-10 text-center mb-10"
        >
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center mx-auto mb-3"
            style={{ background: '#14141a' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="6" r="3.5" stroke="#333340" strokeWidth="1.5" />
              <path d="M2 16c0-3.866 3.134-6 7-6s7 2.134 7 6" stroke="#333340" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm mb-2" style={{ color: '#444450' }}>No accounts connected.</p>
          <Link href="/accounts" className="text-sm transition-colors" style={{ color: '#2dd4bf' }}>
            Add your first account →
          </Link>
        </div>
      )}

      {/* Recent posts */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-label">
          Recent Posts
        </h2>
        <Link href="/history" className="text-[11px] transition-colors" style={{ color: '#444450' }}>
          View all →
        </Link>
      </div>

      {recentPosts.length > 0 ? (
        <div
          className="glass-card rounded-[14px] overflow-hidden overflow-x-auto"
        >
          <table className="w-full min-w-[500px]">
            <thead>
              <tr style={{ borderBottom: '1px solid #16161e' }}>
                {['Title', 'Account', 'Platforms', 'Status', 'Date'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10px] uppercase tracking-[0.12em] font-medium px-4 py-3 first:pl-5"
                    style={{ color: '#333340' }}
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
                    style={{ borderBottom: idx < recentPosts.length - 1 ? '1px solid #0d0d10' : 'none' }}
                  >
                    <td className="px-4 py-3.5 pl-5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate max-w-[160px] block" style={{ color: '#eaeaee' }}>
                          {post.title}
                        </span>
                        {post.automation_rule_id && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
                            style={{ background: 'rgba(45,212,191,0.08)', color: '#2dd4bf' }}
                          >
                            auto
                          </span>
                        )}
                      </div>
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
                          <span className="text-xs" style={{ color: '#5c5c6a' }}>{account.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: '#333340' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(post.platforms as string[]).slice(0, 3).map((p) => (
                          <PlatformBadge key={p} platform={p} size="sm" />
                        ))}
                        {(post.platforms as string[]).length > 3 && (
                          <span className="text-[10px]" style={{ color: '#444450' }}>
                            +{(post.platforms as string[]).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono tabular-nums" style={{ color: '#444450' }}>
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
          className="glass-card rounded-[14px] p-10 text-center"
        >
          <p className="text-sm mb-2" style={{ color: '#444450' }}>No posts yet.</p>
          <Link href="/flows" className="text-sm transition-colors" style={{ color: '#2dd4bf' }}>
            Set up automation →
          </Link>
        </div>
      )}
    </div>
  );
}
