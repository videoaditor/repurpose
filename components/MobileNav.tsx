'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.35" />
      </svg>
    ),
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <path d="M2 12l3.5-4 3 2.5L12 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="2" cy="12" r="1.2" fill="currentColor" />
        <circle cx="5.5" cy="8" r="1.2" fill="currentColor" />
        <circle cx="8.5" cy="10.5" r="1.2" fill="currentColor" />
        <circle cx="12" cy="5" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/post',
    label: 'Post',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    primary: true,
  },
  {
    href: '/history',
    label: 'History',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/accounts',
    label: 'Accounts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2.5 13.5c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        height: '60px',
        background: '#0a0a0a',
        borderTop: '1px solid #1e1e1e',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {nav.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors"
            style={{
              color: isActive ? '#a78bfa' : '#4a4a4a',
              minHeight: '44px',
            }}
          >
            {item.primary ? (
              <span
                className="flex items-center justify-center rounded-full mb-0.5"
                style={{
                  width: '36px',
                  height: '36px',
                  background: isActive ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.1)',
                  color: '#a78bfa',
                }}
              >
                {item.icon}
              </span>
            ) : (
              <span>{item.icon}</span>
            )}
            {!item.primary && (
              <span style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.02em' }}>
                {item.label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
