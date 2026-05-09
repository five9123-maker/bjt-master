import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'BJT Master — 비즈니스 일본어 단어장',
  description: 'BJT 비즈니스 일본어 능력 테스트 대비 단어장 앱',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-dvh flex flex-col">
        <ThemeProvider>
          <main className="flex-1 pb-20">{children}</main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
