import type { Metadata } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${syne.variable} ${dmSans.variable} antialiased`} style={{ background: '#080808', color: '#f5f5f5' }}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-h-screen" style={{ marginLeft: '220px' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
