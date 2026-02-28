import { db } from '@/lib/db';
import { accounts, posts } from '@/drizzle/schema';
import { desc } from 'drizzle-orm';
import AccountCard from '@/components/AccountCard';
import PlatformBadge from '@/components/PlatformBadge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-[#555] mt-0.5">Manage and distribute your content</p>
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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Accounts', value: allAccounts.length, sub: 'connected' },
          { label: 'Posts This Week', value: postsThisWeek, sub: 'published' },
          { label: 'Platforms Active', value: activePlatforms.size, sub: 'channels' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4">
            <div className="text-2xl font-bold font-mono text-white">{stat.value}</div>
            <div className="text-xs text-[#555] mt-0.5 uppercase tracking-wide font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Accounts grid */}
      {allAccounts.length > 0 ? (
        <>
          <h2 className="font-display font-semibold text-[#888] text-xs uppercase tracking-widest mb-3">
            Accounts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {allAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                postCount={postCountMap[account.id] ?? 0}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="bg-[#111] border border-[#1e1e1e] border-dashed rounded-xl p-10 text-center mb-10">
          <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center mx-auto mb-3">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="6" r="3.5" stroke="#555" strokeWidth="1.5" />
              <path d="M2 16c0-3.866 3.134-6 7-6s7 2.134 7 6" stroke="#555" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[#555] text-sm">No accounts yet.</p>
          <Link href="/accounts" className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors mt-1 inline-block">
            Add your first account →
          </Link>
        </div>
      )}

      {/* Recent posts */}
      <h2 className="font-display font-semibold text-[#888] text-xs uppercase tracking-widest mb-3">
        Recent Posts
      </h2>
      {recentPosts.length > 0 ? (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {['Title', 'Account', 'Platforms', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left text-[11px] text-[#555] uppercase tracking-widest font-medium px-4 py-3 first:pl-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPosts.map((post) => {
                const account = accountMap[post.account_id];
                return (
                  <tr
                    key={post.id}
                    className="border-b border-[#0f0f0f] hover:bg-[#0f0f0f] transition-colors last:border-0"
                  >
                    <td className="px-4 py-3 pl-5">
                      <span className="text-sm text-white font-medium truncate max-w-[180px] block">
                        {post.title}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {account ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: account.color }}
                          >
                            {account.name[0].toUpperCase()}
                          </div>
                          <span className="text-xs text-[#888]">{account.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#555]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(post.platforms as string[]).slice(0, 3).map((p) => (
                          <PlatformBadge key={p} platform={p} size="sm" />
                        ))}
                        {(post.platforms as string[]).length > 3 && (
                          <span className="text-[10px] text-[#555]">
                            +{(post.platforms as string[]).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#555] font-mono">
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
        <div className="bg-[#111] border border-[#1e1e1e] border-dashed rounded-xl p-8 text-center">
          <p className="text-[#555] text-sm">No posts yet. Create your first post.</p>
          <Link href="/post" className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors mt-1 inline-block">
            Create a post →
          </Link>
        </div>
      )}
    </div>
  );
}
