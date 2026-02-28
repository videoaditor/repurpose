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
    <div
      className="relative rounded-[14px] p-5 overflow-hidden transition-all duration-200 group card-hover"
      style={{
        background: '#111111',
        border: '1px solid #1e1e1e',
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[14px] transition-opacity duration-200"
        style={{ background: account.color, opacity: 0.7 }}
      />

      <div className="flex items-start justify-between mb-4">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[13px] font-bold font-display text-white flex-shrink-0"
          style={{
            backgroundColor: account.color,
            boxShadow: `0 4px 14px ${account.color}35`,
          }}
        >
          {initials}
        </div>

        {/* Post count */}
        <div className="text-right">
          <div className="text-[22px] font-bold font-mono tabular-nums leading-none" style={{ color: '#f5f5f5' }}>
            {postCount}
          </div>
          <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: '#4a4a4a' }}>
            posts
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mb-3">
        <h3 className="font-display font-semibold text-[14px] leading-tight" style={{ color: '#f5f5f5' }}>
          {account.name}
        </h3>
        <p className="text-[11px] mt-0.5 font-mono" style={{ color: '#4a4a4a' }}>
          @{account.username}
        </p>
      </div>

      {/* Platform badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(account.platforms as string[]).map((platform) => (
          <PlatformBadge key={platform} platform={platform} size="sm" />
        ))}
      </div>

      {/* Links */}
      <div className="flex items-center gap-4">
        <Link
          href={`/history?accountId=${account.id}`}
          className="text-[11px] font-medium transition-colors"
          style={{ color: '#4a4a4a' }}
        >
          History →
        </Link>
        <Link
          href={`/analytics?accountId=${account.id}`}
          className="text-[11px] font-medium transition-colors"
          style={{ color: '#4a4a4a' }}
        >
          Analytics →
        </Link>
      </div>
    </div>
  );
}
