'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useStore((s) => s.settings.darkMode);
  const fontSize = useStore((s) => s.settings.fontSize);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', darkMode);
    html.setAttribute('data-fs', fontSize);
  }, [darkMode, fontSize]);

  return <>{children}</>;
}
