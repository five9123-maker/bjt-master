'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import SpeakButton from '@/components/SpeakButton';
import { useStore } from '@/lib/store';
import type { Word, StudyStatus } from '@/types/word';

const STATUS_LABELS: Record<StudyStatus, string> = {
  new: '미학습',
  learning: '학습중',
  done: '완료',
};
const STATUS_COLORS: Record<StudyStatus, string> = {
  new: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  learning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

export default function WordCard({ word }: { word: Word }) {
  const [expanded, setExpanded] = useState(false);
  const progress = useStore((s) => s.progress[word.id]);
  const markStatus = useStore((s) => s.markStatus);
  const { showReading, showRomaji, autoShowKr } = useStore((s) => s.settings);

  const status: StudyStatus = progress?.status ?? 'new';

  const cycle = () => {
    const next: StudyStatus = status === 'new' ? 'learning' : status === 'learning' ? 'done' : 'new';
    markStatus(word.id, next);
  };

  return (
    <div className="bg-[var(--card,#fff)] dark:bg-[#252219] border border-[var(--border)] rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-ja text-2xl font-bold text-[var(--foreground)]">{word.japanese}</span>
            {showReading && (
              <span className="text-sm text-[var(--muted-foreground)]">({word.reading})</span>
            )}
          </div>
          {showRomaji && (
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5 font-mono">{word.romaji}</p>
          )}
          {autoShowKr && (
            <p className="text-base font-semibold mt-1">{word.korean}</p>
          )}
          {!autoShowKr && (
            <button
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-1 transition-colors"
              onClick={() => setExpanded((p) => !p)}
            >
              {expanded ? word.korean : '한국어 뜻 보기 ▾'}
            </button>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <SpeakButton text={word.japanese} size="sm" />
          <button
            onClick={cycle}
            className={`text-xs px-2 py-1 rounded-full font-medium transition-colors min-w-[52px] text-center ${STATUS_COLORS[status]}`}
          >
            {status === 'done' ? '✓ 완료' : STATUS_LABELS[status]}
          </button>
        </div>
      </div>

      {expanded && !autoShowKr && (
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <p className="font-semibold">{word.korean}</p>
        </div>
      )}

      <button
        className="mt-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        {expanded ? '예문 닫기 ▴' : '예문 보기 ▾'}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1">
          <p className="font-ja text-sm text-[var(--foreground)]">{word.example}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{word.exampleKorean}</p>
          <div className="flex gap-1 flex-wrap mt-1">
            {word.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
            ))}
            <Badge variant="outline" className="text-xs">빈도 {'★'.repeat(word.frequency)}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}
