interface PlatformBadgeProps {
  platform: string;
  size?: 'sm' | 'md';
}

const platformConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  tiktok: {
    label: 'TikTok',
    color: '#fe2c55',
    bg: 'rgba(254, 44, 85, 0.12)',
    icon: '🎵',
  },
  youtube: {
    label: 'YouTube',
    color: '#ff0000',
    bg: 'rgba(255, 0, 0, 0.12)',
    icon: '▶',
  },
  instagram: {
    label: 'Instagram',
    color: '#c13584',
    bg: 'rgba(193, 53, 132, 0.12)',
    icon: '◈',
  },
  x: {
    label: 'X',
    color: '#e7e7e7',
    bg: 'rgba(231, 231, 231, 0.08)',
    icon: '✕',
  },
  linkedin: {
    label: 'LinkedIn',
    color: '#0077b5',
    bg: 'rgba(0, 119, 181, 0.12)',
    icon: 'in',
  },
};

export default function PlatformBadge({ platform, size = 'md' }: PlatformBadgeProps) {
  const config = platformConfig[platform.toLowerCase()] ?? {
    label: platform,
    color: '#888',
    bg: 'rgba(136, 136, 136, 0.1)',
    icon: '◉',
  };

  const sizeClass = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5 gap-1'
    : 'text-xs px-2 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${sizeClass}`}
      style={{
        color: config.color,
        backgroundColor: config.bg,
        borderColor: `${config.color}30`,
      }}
    >
      <span className={size === 'sm' ? 'text-[10px]' : 'text-xs'}>{config.icon}</span>
      {config.label}
    </span>
  );
}
