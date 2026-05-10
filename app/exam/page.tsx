'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import type { ExamLevel } from '@/lib/store';

type Difficulty = 'J5' | 'J4' | 'J3' | 'J2';
const DIFFICULTIES: { value: Difficulty; label: string; desc: string; freqMin: number }[] = [
  { value: 'J5', label: '입문 J5', desc: '빈도 5 핵심 단어만', freqMin: 5 },
  { value: 'J4', label: '기초 J4', desc: '빈도 4~5 단어', freqMin: 4 },
  { value: 'J3', label: '중급 J3', desc: '빈도 3~5 전체', freqMin: 3 },
  { value: 'J2', label: '고급 J2', desc: '오답 우선 + 전체', freqMin: 3 },
];
const TIME_LIMITS = [
  { value: 600, label: '10분' },
  { value: 1200, label: '20분' },
  { value: 1800, label: '30분' },
];
const COUNTS = [20, 30, 50];

const LEVEL_COLORS: Record<string, string> = {
  J1: 'text-purple-600', J2: 'text-blue-600',
  J3: 'text-green-600', J4: 'text-yellow-600', J5: 'text-gray-500',
};

export default function ExamSetupPage() {
  const router = useRouter();
  const examHistory = useStore((s) => s.examHistory);

  const [difficulty, setDifficulty] = useState<Difficulty>('J3');
  const [timeLimit, setTimeLimit] = useState(1200);
  const [count, setCount] = useState(20);

  const start = () => {
    const params = new URLSearchParams({
      difficulty,
      timeLimit: String(timeLimit),
      count: String(count),
    });
    router.push(`/exam/play?${params}`);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <header>
        <h1 className="font-bold text-xl">📝 실전 테스트</h1>
        <p className="text-sm text-[var(--muted-foreground)]">제한 시간 내 전 유형 혼합 출제 · 즉각 피드백 없음</p>
      </header>

      {/* 난이도 */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">난이도</h2>
        <div className="grid grid-cols-2 gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`p-3 rounded-xl border text-left transition-all ${
                difficulty === d.value
                  ? 'border-[var(--gold,#b08030)] bg-[var(--gold,#b08030)]/10'
                  : 'border-[var(--border)] bg-[var(--card,#fff)] dark:bg-[#252219]'
              }`}
            >
              <p className="font-bold text-sm">{d.label}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{d.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 시간 */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">제한 시간</h2>
        <div className="flex gap-2">
          {TIME_LIMITS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTimeLimit(value)}
              className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition-colors ${
                timeLimit === value
                  ? 'bg-[var(--gold,#b08030)] text-white border-[var(--gold,#b08030)]'
                  : 'border-[var(--border)] bg-[var(--card,#fff)] dark:bg-[#252219]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* 문제 수 */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">문제 수</h2>
        <div className="flex gap-2">
          {COUNTS.map((c) => (
            <button
              key={c}
              onClick={() => setCount(c)}
              className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition-colors ${
                count === c
                  ? 'bg-[var(--gold,#b08030)] text-white border-[var(--gold,#b08030)]'
                  : 'border-[var(--border)] bg-[var(--card,#fff)] dark:bg-[#252219]'
              }`}
            >
              {c}문제
            </button>
          ))}
        </div>
      </section>

      {/* 유형 안내 */}
      <section className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-xl border border-[var(--border)] p-4 space-y-2">
        <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">출제 유형</h2>
        {[
          { type: 'I', ratio: '40%', desc: '일본어 → 한국어 뜻 선택' },
          { type: 'II', ratio: '30%', desc: '예문 빈칸 채우기' },
          { type: 'III', ratio: '20%', desc: '듣기 — TTS 듣고 뜻 선택' },
          { type: 'IV', ratio: '10%', desc: '경어 표현 선택 (경어 카테고리)' },
        ].map(({ type, ratio, desc }) => (
          <div key={type} className="flex items-center gap-3 text-sm">
            <span className="w-14 text-xs px-2 py-0.5 rounded bg-[var(--gold,#b08030)]/10 text-[var(--gold,#b08030)] font-mono text-center shrink-0">
              유형 {type}
            </span>
            <span className="text-[var(--muted-foreground)] w-10 shrink-0">{ratio}</span>
            <span>{desc}</span>
          </div>
        ))}
      </section>

      <button
        onClick={start}
        className="w-full py-4 rounded-xl bg-[var(--gold,#b08030)] text-white font-bold text-lg shadow-md hover:opacity-90 active:scale-95 transition-all"
      >
        시험 시작 →
      </button>

      {/* 최근 기록 */}
      {examHistory.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">최근 기록</h2>
          <div className="space-y-2">
            {examHistory.map((r) => (
              <button
                key={r.id}
                onClick={() => router.push(`/exam/result?id=${r.id}`)}
                className="w-full flex items-center gap-3 bg-[var(--card,#fff)] dark:bg-[#252219] rounded-xl border border-[var(--border)] px-4 py-3 hover:border-[var(--gold,#b08030)]/50 transition-colors"
              >
                <span className={`text-xl font-bold ${LEVEL_COLORS[r.level]}`}>{r.level}</span>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold">{r.score}점 · {r.correct}/{r.totalQ} 정답</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {new Date(r.date).toLocaleDateString('ko-KR')} · {r.difficulty}
                  </p>
                </div>
                <span className="text-[var(--muted-foreground)] text-xs">상세 →</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
