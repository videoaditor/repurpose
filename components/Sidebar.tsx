'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const nav = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.35" />
      </svg>
    ),
  },
  {
    href: '/post',
    label: 'New Post',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    badge: 'new',
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 12l3.5-4 3 2.5L12 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="2" cy="12" r="1.2" fill="currentColor" />
        <circle cx="5.5" cy="8" r="1.2" fill="currentColor" />
        <circle cx="8.5" cy="10.5" r="1.2" fill="currentColor" />
        <circle cx="12" cy="5" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/flows',
    label: 'Flows',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="4" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="11" y="4" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 6h2.5M8.5 6H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8" cy="6" r="0.8" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/accounts',
    label: 'Accounts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2.5 13.5c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'History',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="hidden md:flex fixed top-0 left-0 h-full flex-col z-40 transition-all duration-200"
      style={{
        width: collapsed ? '56px' : '220px',
        background: '#0a0a0a',
        borderRight: '1px solid #1a1a1a',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center border-b"
        style={{
          borderColor: '#1a1a1a',
          padding: collapsed ? '20px 0' : '20px 16px',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: '60px',
        }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', boxShadow: '0 4px 12px rgba(167,139,250,0.3)' }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 4l5-3 5 3v6l-5 3-5-3V4z" stroke="white" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M7 1v12M2 4l5 3 5-3" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-display font-bold text-[14px] tracking-tight" style={{ color: '#f5f5f5' }}>
              Repurpose
            </span>
          </div>
        )}
        {collapsed && (
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', boxShadow: '0 4px 12px rgba(167,139,250,0.3)' }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 4l5-3 5 3v6l-5 3-5-3V4z" stroke="white" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M7 1v12M2 4l5 3 5-3" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="transition-colors p-1 rounded"
            style={{ color: '#333' }}
            title="Collapse"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3" style={{ padding: '12px 8px' }}>
        {nav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <div key={item.href} className="relative group mb-0.5">
              <Link
                href={item.href}
                className={`sidebar-nav-item flex items-center transition-all duration-150 rounded-[10px] ${isActive ? 'active' : ''}`}
                style={{
                  gap: collapsed ? 0 : '10px',
                  padding: collapsed ? '9px 0' : '9px 10px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="text-[13px] font-medium flex-1">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>

              {/* Tooltip for collapsed mode */}
              {collapsed && (
                <div
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
                  style={{ background: '#1a1a1a', color: '#f5f5f5', border: '1px solid #2a2a2a', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                >
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="border-t flex items-center"
        style={{
          borderColor: '#1a1a1a',
          padding: collapsed ? '16px 0' : '14px 16px',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed ? (
          <>
            <p className="text-[10px] font-mono" style={{ color: '#2a2a2a' }}>v1.0.0</p>
            <button
              onClick={() => setCollapsed(false)}
              className="opacity-0 pointer-events-none"
            />
          </>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="transition-colors"
            style={{ color: '#333' }}
            title="Expand"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2l4 5-4 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
}
