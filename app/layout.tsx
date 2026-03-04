import type { Metadata, Viewport } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Repurpose',
  description: 'Multi-platform content distribution at scale',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Repurpose',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#080808',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${syne.variable} ${dmSans.variable} antialiased noise-overlay`} style={{ background: '#050507', color: '#eaeaee' }}>
        <div className="ambient-glow" />
        <div className="flex min-h-screen relative z-[1]">
          <Sidebar />
          {/* On mobile: no left margin, padding-bottom for bottom nav. On md+: left margin for sidebar */}
          <main className="flex-1 min-h-screen pb-16 md:pb-0 md:ml-[220px]">
            {children}
          </main>
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
