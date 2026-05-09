'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import SpeakButton from '@/components/SpeakButton';
import { useStore } from '@/lib/store';
import vocab from '@/data/vocab.json';
import type { Word } from '@/types/word';

const words = vocab as Word[];

type Difficulty = 'easy' | 'normal' | 'hard';

const DIFF_CONFIG: Record<Difficulty, { label: string; color: string }> = {
  easy:   { label: '쉬움', color: 'bg-green-100 text-green-700 border-green-300' },
  normal: { label: '보통', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  hard:   { label: '어려움', color: 'bg-red-100 text-red-700 border-red-300' },
};

export default function FlipPage() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Record<string, Difficulty>>({});
  const [done, setDone] = useState(false);
  const startRef = useRef(Date.now());

  const { showReading, showRomaji } = useStore((s) => s.settings);
  const updateProgress = useStore((s) => s.updateProgress);
  const addStudyTime = useStore((s) => s.addStudyTime);

  const word = words[idx];
  const total = words.length;

  // 학습 시간 기록
  useEffect(() => {
    return () => {
      const elapsed = Math.round((Date.now() - startRef.current) / 1000);
      if (elapsed > 3) addStudyTime(elapsed);
    };
  }, [addStudyTime]);

  const flip = useCallback(() => setFlipped((f) => !f), []);

  const go = useCallback(
    (dir: 1 | -1) => {
      const next = idx + dir;
      if (next < 0 || next >= total) return;
      setIdx(next);
      setFlipped(false);
    },
    [idx, total]
  );

  const markDiff = (diff: Difficulty) => {
    setResults((r) => ({ ...r, [word.id]: diff }));
    updateProgress(word.id, {
      status: diff === 'easy' ? 'done' : 'learning',
      difficulty: diff,
    });
    if (idx < total - 1) {
      setIdx((i) => i + 1);
      setFlipped(false);
    } else {
      const elapsed = Math.round((Date.now() - startRef.current) / 1000);
      addStudyTime(elapsed);
      startRef.current = Date.now();
      setDone(true);
    }
  };

  // 키보드
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); flip(); }
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (flipped) {
        if (e.key === 'ArrowUp') markDiff('easy');
        if (e.key === 'ArrowDown') markDiff('hard');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flip, go, flipped, idx]);

  // 스와이프
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
    if (dy > 40) return;
    if (Math.abs(dx) > 50) {
      go(dx < 0 ? 1 : -1);
    } else {
      flip();
    }
    touchStart.current = null;
  };

  if (done) {
    const easy = Object.values(results).filter((d) => d === 'easy').length;
    const normal = Object.values(results).filter((d) => d === 'normal').length;
    const hard = Object.values(results).filter((d) => d === 'hard').length;
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold">학습 완료! 🎉</h1>
        <div className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-xl p-6 w-full space-y-3 border border-[var(--border)]">
          <p className="text-center text-[var(--muted-foreground)] mb-4">총 {total}개 학습</p>
          {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => {
            const count = d === 'easy' ? easy : d === 'normal' ? normal : hard;
            return (
              <div key={d} className="flex justify-between items-center">
                <span className={`text-sm px-3 py-1 rounded-full border ${DIFF_CONFIG[d].color}`}>
                  {DIFF_CONFIG[d].label}
                </span>
                <span className="font-bold text-lg">{count}개</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={() => { setIdx(0); setFlipped(false); setDone(false); setResults({}); }}>
            다시 학습
          </Button>
          <Button className="flex-1 bg-[var(--gold,#b08030)] hover:bg-[var(--gold,#b08030)]/90" onClick={() => router.push('/')}>
            홈으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-4 select-none">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="text-[var(--muted-foreground)] text-2xl px-1">←</button>
        <span className="text-sm font-medium">{idx + 1} / {total}</span>
        <span className="text-xs text-[var(--muted-foreground)]">{word.category}</span>
      </div>

      {/* 진행바 */}
      <Progress value={Math.round(((idx + 1) / total) * 100)} className="h-1.5" />

      {/* 플립카드 */}
      <div
        className="flip-card swipe-container"
        style={{ height: 'clamp(280px, 55vw, 380px)' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={flip}
      >
        <div className={`flip-card-inner ${flipped ? 'flipped' : ''}`}>
          {/* 앞면 */}
          <div className="flip-card-front bg-[var(--card,#fff)] dark:bg-[#252219] rounded-2xl border border-[var(--border)] shadow-md flex flex-col items-center justify-center gap-3 p-6">
            <p className="font-ja text-5xl font-bold text-center">{word.japanese}</p>
            {showReading && (
              <p className="text-[var(--muted-foreground)] text-lg">{word.reading}</p>
            )}
            {showRomaji && (
              <p className="text-sm text-[var(--muted-foreground)] font-mono">{word.romaji}</p>
            )}
            <SpeakButton text={word.japanese} />
            <p className="text-xs text-[var(--muted-foreground)] mt-2">탭하여 뒤집기</p>
          </div>

          {/* 뒷면 */}
          <div className="flip-card-back bg-[var(--gold,#b08030)]/5 dark:bg-[#252219] rounded-2xl border border-[var(--gold,#b08030)]/30 shadow-md flex flex-col items-center justify-center gap-3 p-6">
            <p className="text-3xl font-bold text-center">{word.korean}</p>
            <div className="w-full mt-2 space-y-1 text-center">
              <p className="font-ja text-sm">{word.example}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{word.exampleKorean}</p>
            </div>
            <SpeakButton text={word.example} size="sm" />
          </div>
        </div>
      </div>

      {/* 난이도 버튼 (뒷면 표시 시) */}
      {flipped && (
        <div className="flex gap-2">
          {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => markDiff(d)}
              className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all active:scale-95 ${DIFF_CONFIG[d].color}`}
            >
              {DIFF_CONFIG[d].label}
            </button>
          ))}
        </div>
      )}

      {/* 이동 버튼 */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 h-12" onClick={() => go(-1)} disabled={idx === 0}>
          ← 이전
        </Button>
        <Button variant="outline" className="flex-1 h-12" onClick={flip}>
          {flipped ? '앞면' : '뒷면'}
        </Button>
        <Button variant="outline" className="flex-1 h-12" onClick={() => go(1)} disabled={idx === total - 1}>
          다음 →
        </Button>
      </div>

      <p className="text-xs text-center text-[var(--muted-foreground)]">
        Space: 뒤집기 · ← →: 이동 · ↑↓: 난이도 (뒷면)
      </p>
    </div>
  );
}
