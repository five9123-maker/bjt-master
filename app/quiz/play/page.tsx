'use client';

import { use, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import SpeakButton from '@/components/SpeakButton';
import { useStore } from '@/lib/store';
import { speak } from '@/lib/tts';
import vocab from '@/data/vocab.json';
import type { Word } from '@/types/word';

const ALL_WORDS = vocab as Word[];

// ----- 유틸 -----
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildChoices(correct: Word, pool: Word[], type: 'jp-to-kr' | 'kr-to-jp' | 'listening') {
  const wrongPool = pool.filter((w) => w.id !== correct.id);
  const wrongs = shuffle(wrongPool).slice(0, 3);
  const options = shuffle([correct, ...wrongs]);
  return options.map((w) => ({
    id: w.id,
    label: type === 'kr-to-jp' ? w.japanese : w.korean,
    isCorrect: w.id === correct.id,
  }));
}

interface QuizItem {
  word: Word;
  choices: { id: string; label: string; isCorrect: boolean }[];
}

// ----- 결과 화면 -----
function ResultScreen({
  items,
  answers,
  onRetry,
  onQuit,
}: {
  items: QuizItem[];
  answers: Record<number, string>;
  onRetry: () => void;
  onQuit: () => void;
}) {
  const correct = items.filter((item, i) =>
    item.choices.find((c) => c.id === answers[i])?.isCorrect
  ).length;
  const total = items.length;
  const pct = Math.round((correct / total) * 100);

  const grade =
    pct >= 90 ? { label: '완벽해요! 🏆', color: 'text-yellow-500' } :
    pct >= 70 ? { label: '잘했어요! 🎉', color: 'text-green-500' } :
    pct >= 50 ? { label: '좋아요! 💪', color: 'text-blue-500' } :
                { label: '다시 도전! 📚', color: 'text-orange-500' };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <p className={`text-4xl font-bold ${grade.color}`}>{pct}점</p>
        <p className="text-2xl font-semibold">{grade.label}</p>
        <p className="text-[var(--muted-foreground)]">{total}문제 중 {correct}개 정답</p>
      </div>

      {/* 오답 목록 */}
      {correct < total && (
        <section className="space-y-2">
          <h2 className="font-semibold text-sm">오답 복습</h2>
          {items.map((item, i) => {
            const chosen = item.choices.find((c) => c.id === answers[i]);
            if (chosen?.isCorrect) return null;
            const correctChoice = item.choices.find((c) => c.isCorrect);
            return (
              <div key={i} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-ja font-bold">{item.word.japanese}</span>
                  <span className="text-[var(--muted-foreground)] text-xs">{item.word.reading}</span>
                </div>
                <div className="mt-1 text-xs space-y-0.5">
                  <p className="text-red-600 dark:text-red-400">
                    내 답: {chosen?.label ?? '(미선택)'}
                  </p>
                  <p className="text-green-700 dark:text-green-400 font-semibold">
                    정답: {correctChoice?.label}
                  </p>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 py-3 rounded-xl border border-[var(--border)] font-semibold text-sm hover:bg-[var(--gold,#b08030)]/10 transition-colors"
        >
          다시 풀기
        </button>
        <button
          onClick={onQuit}
          className="flex-1 py-3 rounded-xl bg-[var(--gold,#b08030)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          퀴즈 설정으로
        </button>
      </div>
    </div>
  );
}

// ----- 메인 -----
export default function QuizPlayPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string; count?: string }>;
}) {
  const params = use(searchParams);
  const router = useRouter();
  const type = (params.type ?? 'jp-to-kr') as 'jp-to-kr' | 'kr-to-jp' | 'listening';
  const category = params.category ?? '전체';
  const count = Math.min(parseInt(params.count ?? '10', 10), 30);

  const markStatus = useStore((s) => s.markStatus);
  const addStudyTime = useStore((s) => s.addStudyTime);
  const ttsSpeed = useStore((s) => s.settings.ttsSpeed);
  const startRef = useRef(Date.now());

  // 퀴즈 아이템 생성 (1회만)
  const items = useMemo<QuizItem[]>(() => {
    const pool =
      category === '전체' ? ALL_WORDS : ALL_WORDS.filter((w) => w.category === category);
    const selected = shuffle(pool).slice(0, count);
    return selected.map((word) => ({
      word,
      choices: buildChoices(word, pool.length >= 4 ? pool : ALL_WORDS, type),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  const item = items[idx];

  // 듣기 모드 — 카드 진입 시 자동 재생
  useEffect(() => {
    if (type === 'listening' && item) {
      speak(item.word.japanese, ttsSpeed);
    }
  }, [idx, type, item, ttsSpeed]);

  // 학습 시간 기록
  useEffect(() => {
    return () => {
      const elapsed = Math.round((Date.now() - startRef.current) / 1000);
      if (elapsed > 3) addStudyTime(elapsed);
    };
  }, [addStudyTime]);

  const choose = useCallback(
    (choiceId: string) => {
      if (revealed) return;
      setSelected(choiceId);
      setRevealed(true);
      const isCorrect = item.choices.find((c) => c.id === choiceId)?.isCorrect ?? false;
      setAnswers((a) => ({ ...a, [idx]: choiceId }));
      // 진도 업데이트
      markStatus(item.word.id, isCorrect ? 'done' : 'learning');
    },
    [revealed, item, idx, markStatus]
  );

  const next = useCallback(() => {
    if (idx < items.length - 1) {
      setIdx((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      const elapsed = Math.round((Date.now() - startRef.current) / 1000);
      addStudyTime(elapsed);
      startRef.current = Date.now();
      setDone(true);
    }
  }, [idx, items.length, addStudyTime]);

  // 키보드 1~4 선택, Enter 다음
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4 && !revealed) {
        choose(item.choices[n - 1]?.id ?? '');
      }
      if (e.key === 'Enter' && revealed) next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [choose, next, revealed, item]);

  const retry = () => {
    setIdx(0);
    setAnswers({});
    setSelected(null);
    setRevealed(false);
    setDone(false);
  };

  if (done) {
    return (
      <ResultScreen
        items={items}
        answers={answers}
        onRetry={retry}
        onQuit={() => router.push('/quiz')}
      />
    );
  }

  const correctChoice = item.choices.find((c) => c.isCorrect);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/quiz')}
          className="text-[var(--muted-foreground)] text-2xl px-1"
        >
          ←
        </button>
        <span className="text-sm font-medium">{idx + 1} / {items.length}</span>
        <span className="text-xs text-[var(--muted-foreground)]">
          {type === 'jp-to-kr' ? 'JP→KR' : type === 'kr-to-jp' ? 'KR→JP' : '듣기'}
        </span>
      </div>

      <Progress value={Math.round(((idx + 1) / items.length) * 100)} className="h-1.5" />

      {/* 문제 카드 */}
      <div className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-2xl border border-[var(--border)] p-6 min-h-[160px] flex flex-col items-center justify-center gap-3 shadow-sm">
        {type === 'listening' ? (
          <>
            <p className="text-[var(--muted-foreground)] text-sm">발음을 듣고 올바른 뜻을 고르세요</p>
            <SpeakButton text={item.word.japanese} />
            {revealed && (
              <p className="font-ja text-2xl font-bold mt-1">{item.word.japanese}</p>
            )}
          </>
        ) : type === 'jp-to-kr' ? (
          <>
            <p className="font-ja text-4xl font-bold text-center">{item.word.japanese}</p>
            <p className="text-[var(--muted-foreground)]">{item.word.reading}</p>
            <SpeakButton text={item.word.japanese} size="sm" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-center">{item.word.korean}</p>
            <p className="text-sm text-[var(--muted-foreground)]">{item.word.category}</p>
          </>
        )}
      </div>

      {/* 보기 */}
      <div className="grid grid-cols-2 gap-3">
        {item.choices.map((choice, i) => {
          let bg = 'bg-[var(--card,#fff)] dark:bg-[#252219] border-[var(--border)] hover:border-[var(--gold,#b08030)]';
          if (revealed) {
            if (choice.isCorrect) {
              bg = 'bg-green-100 dark:bg-green-900/30 border-green-400 text-green-800 dark:text-green-300';
            } else if (choice.id === selected && !choice.isCorrect) {
              bg = 'bg-red-100 dark:bg-red-900/30 border-red-400 text-red-700 dark:text-red-300';
            } else {
              bg = 'bg-[var(--card,#fff)] dark:bg-[#252219] border-[var(--border)] opacity-50';
            }
          }
          return (
            <button
              key={choice.id}
              onClick={() => choose(choice.id)}
              disabled={revealed}
              className={`relative p-4 rounded-xl border font-medium text-sm text-left transition-all active:scale-95 min-h-[64px] flex items-center gap-2 ${bg}`}
            >
              <span className="text-[var(--muted-foreground)] text-xs shrink-0 w-4">{i + 1}</span>
              <span className={`${type === 'kr-to-jp' ? 'font-ja' : ''}`}>{choice.label}</span>
              {revealed && choice.isCorrect && (
                <span className="absolute top-2 right-2 text-green-500 text-xs font-bold">✓</span>
              )}
              {revealed && choice.id === selected && !choice.isCorrect && (
                <span className="absolute top-2 right-2 text-red-500 text-xs font-bold">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 정답 후 피드백 */}
      {revealed && (
        <div
          className={`rounded-xl p-4 border text-sm space-y-1 ${
            selected && item.choices.find((c) => c.id === selected)?.isCorrect
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          {selected && item.choices.find((c) => c.id === selected)?.isCorrect ? (
            <p className="font-semibold text-green-700 dark:text-green-300">정답! 🎉</p>
          ) : (
            <>
              <p className="font-semibold text-red-600 dark:text-red-400">
                오답 — 정답: <span className={type === 'kr-to-jp' ? 'font-ja' : ''}>{correctChoice?.label}</span>
              </p>
            </>
          )}
          <p className="text-[var(--muted-foreground)] text-xs">{item.word.example}</p>
          <p className="text-[var(--muted-foreground)] text-xs">{item.word.exampleKorean}</p>
        </div>
      )}

      {/* 다음 버튼 */}
      {revealed && (
        <button
          onClick={next}
          className="w-full py-4 rounded-xl bg-[var(--gold,#b08030)] text-white font-bold text-base hover:opacity-90 active:scale-95 transition-all"
        >
          {idx < items.length - 1 ? '다음 문제 →' : '결과 보기 →'}
        </button>
      )}

      <p className="text-xs text-center text-[var(--muted-foreground)]">
        1~4: 보기 선택 · Enter: 다음
      </p>
    </div>
  );
}
