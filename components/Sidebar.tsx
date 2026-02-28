'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.8" />
        <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.8" />
        <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.8" />
        <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    href: '/post',
    label: 'New Post',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/accounts',
    label: 'Accounts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'History',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.5V8l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 4l5-3 5 3v6l-5 3-5-3V4z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M7 1v12M2 4l5 3 5-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-display font-bold text-[15px] tracking-tight text-white">
            Repurpose
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-[#888] hover:text-white hover:bg-[#1a1a1a] border border-transparent'
              }`}
            >
              <span className={`transition-colors ${isActive ? 'text-indigo-400' : 'text-[#555] group-hover:text-[#888]'}`}>
                {item.icon}
              </span>
              {item.label}
              {item.href === '/post' && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 uppercase tracking-wide">
                  new
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#1a1a1a]">
        <p className="text-[11px] text-[#444] font-mono">v1.0.0</p>
      </div>
    </aside>
  );
}
