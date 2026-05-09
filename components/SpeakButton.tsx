'use client';

import { useState } from 'react';
import { speak } from '@/lib/tts';
import { useStore } from '@/lib/store';

interface Props {
  text: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function SpeakButton({ text, className = '', size = 'md' }: Props) {
  const [playing, setPlaying] = useState(false);
  const ttsSpeed = useStore((s) => s.settings.ttsSpeed);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaying(true);
    await speak(text, ttsSpeed);
    setTimeout(() => setPlaying(false), 1200);
  };

  const sz = size === 'sm' ? 'w-8 h-8 text-base' : 'w-11 h-11 text-xl';

  return (
    <button
      onClick={handleClick}
      aria-label="발음 듣기"
      className={`${sz} rounded-full flex items-center justify-center transition-all active:scale-90
        bg-[var(--gold,#b08030)]/10 hover:bg-[var(--gold,#b08030)]/20 text-[var(--gold,#b08030)]
        ${playing ? 'animate-pulse' : ''} ${className}`}
    >
      🔊
    </button>
  );
}
