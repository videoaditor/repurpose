import Link from 'next/link';
import PlatformBadge from './PlatformBadge';

interface AccountCardProps {
  account: {
    id: number;
    name: string;
    username: string;
    color: string;
    platforms: string[];
  };
  postCount?: number;
}

export default function AccountCard({ account, postCount = 0 }: AccountCardProps) {
  const initials = account.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 hover:border-[#2a2a2a] transition-all duration-200 hover:shadow-lg group">
      <div className="flex items-start justify-between mb-4">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-display text-white shadow-lg"
          style={{
            backgroundColor: account.color,
            boxShadow: `0 4px 14px ${account.color}40`,
          }}
        >
          {initials}
        </div>

        {/* Stats */}
        <div className="text-right">
          <div className="text-xl font-bold font-mono text-white">{postCount}</div>
          <div className="text-[11px] text-[#555] uppercase tracking-wide">posts</div>
        </div>
      </div>

      {/* Info */}
      <div className="mb-3">
        <h3 className="font-display font-semibold text-white text-[15px] leading-tight">{account.name}</h3>
        <p className="text-[12px] text-[#555] mt-0.5 font-mono">@{account.username}</p>
      </div>

      {/* Platform badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(account.platforms as string[]).map((platform) => (
          <PlatformBadge key={platform} platform={platform} size="sm" />
        ))}
      </div>

      {/* Link */}
      <Link
        href={`/history?accountId=${account.id}`}
        className="text-[12px] text-[#555] hover:text-indigo-400 transition-colors font-medium"
      >
        View history →
      </Link>
    </div>
  );
}
