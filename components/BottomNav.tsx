'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/learn', label: '단어', icon: '📚' },
  { href: '/learn/flip', label: '플립', icon: '🃏' },
  { href: '/quiz', label: '퀴즈', icon: '✏️' },
  { href: '/settings', label: '설정', icon: '⚙️' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-[var(--card,#fff)] border-t border-[var(--border)] dark:bg-[#1e1b14] safe-area-bottom">
      <ul className="flex">
        {NAV.map(({ href, label, icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs min-h-[56px] justify-center transition-colors ${
                  active
                    ? 'text-[var(--gold,#b08030)] font-semibold'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <span className="text-xl leading-none">{icon}</span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
