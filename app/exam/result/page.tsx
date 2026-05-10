'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Progress } from '@/components/ui/progress';
import vocab from '@/data/vocab.json';
import type { Word } from '@/types/word';
import { useState } from 'react';

const ALL_WORDS = vocab as Word[];

const LEVEL_CONFIG: Record<string, { color: string; bg: string; emoji: string; desc: string }> = {
  J1: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', emoji: '🏆', desc: '비즈니스 일본어 최상급' },
  J2: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', emoji: '🎯', desc: '고급 비즈니스 커뮤니케이션 가능' },
  J3: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', emoji: '💼', desc: '기본 비즈니스 업무 수행 가능' },
  J4: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', emoji: '📖', desc: '기초 비즈니스 어휘 이해 수준' },
  J5: { color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800', emoji: '🌱', desc: '입문 — 학습을 계속해 보세요' },
};

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

export default function ExamResultPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = use(searchParams);
  const router = useRouter();
  const examHistory = useStore((s) => s.examHistory);
  const result = examHistory.find((r) => r.id === id) ?? examHistory[0];
  const [wrongOpen, setWrongOpen] = useState(false);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[var(--muted-foreground)]">결과를 찾을 수 없습니다.</p>
        <button onClick={() => router.push('/exam')} className="text-[var(--gold,#b08030)] font-semibold">
          실전 테스트로 →
        </button>
      </div>
    );
  }

  const lc = LEVEL_CONFIG[result.level];
  const wrongWords = ALL_WORDS.filter((w) => result.wrongWordIds.includes(w.id));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-8">

      {/* 레벨 헤더 */}
      <div className={`rounded-2xl p-6 text-center space-y-2 ${lc.bg}`}>
        <p className="text-4xl">{lc.emoji}</p>
        <p className={`text-5xl font-black ${lc.color}`}>{result.level}</p>
        <p className="font-semibold text-lg">{result.score}점</p>
        <p className="text-sm text-[var(--muted-foreground)]">{lc.desc}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {new Date(result.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} ·
          {result.difficulty} · {result.totalQ}문제
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '정답', value: `${result.correct}/${result.totalQ}`, sub: `${result.score}점` },
          { label: '소요 시간', value: fmt(result.timeUsed), sub: `제한 ${fmt(result.timeLimit)}` },
          { label: '오답', value: `${result.totalQ - result.correct}개`, sub: '복습 필요' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-xl border border-[var(--border)] p-3 text-center">
            <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
            <p className="font-bold text-base mt-0.5">{value}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{sub}</p>
          </div>
        ))}
      </div>

      {/* 유형별 정답률 */}
      <section className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-xl border border-[var(--border)] p-4 space-y-3">
        <h2 className="font-semibold text-sm">유형별 정답률</h2>
        {Object.entries(result.byType).map(([type, stat]) => {
          const pct = Math.round((stat.correct / stat.total) * 100);
          return (
            <div key={type}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-mono text-[var(--gold,#b08030)]">{type}</span>
                <span className={pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500'}>
                  {stat.correct}/{stat.total} ({pct}%)
                </span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          );
        })}
      </section>

      {/* 카테고리별 정답률 */}
      <section className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-xl border border-[var(--border)] p-4 space-y-3">
        <h2 className="font-semibold text-sm">카테고리별 정답률</h2>
        {Object.entries(result.byCategory)
          .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
          .map(([cat, stat]) => {
            const pct = Math.round((stat.correct / stat.total) * 100);
            return (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--muted-foreground)] truncate max-w-[160px]">{cat}</span>
                  <span className={pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500'}>
                    {stat.correct}/{stat.total} ({pct}%)
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            );
          })}
      </section>

      {/* 오답 노트 */}
      {wrongWords.length > 0 && (
        <section className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-xl border border-[var(--border)] overflow-hidden">
          <button
            onClick={() => setWrongOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 font-semibold text-sm"
          >
            <span>오답 노트 ({wrongWords.length}개)</span>
            <span className="text-[var(--muted-foreground)]">{wrongOpen ? '▴' : '▾'}</span>
          </button>
          {wrongOpen && (
            <div className="divide-y divide-[var(--border)]">
              {wrongWords.map((w) => (
                <div key={w.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-ja font-bold text-lg">{w.japanese}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{w.reading}</span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--gold,#b08030)]">{w.korean}</p>
                  <p className="text-xs text-[var(--muted-foreground)] font-ja">{w.example}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{w.exampleKorean}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 액션 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push('/exam')}
          className="py-3 rounded-xl border border-[var(--border)] font-semibold text-sm hover:border-[var(--gold,#b08030)] transition-colors"
        >
          새 시험 시작
        </button>
        {wrongWords.length > 0 && (
          <button
            onClick={() => router.push('/learn/flip')}
            className="py-3 rounded-xl bg-[var(--gold,#b08030)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            오답 플립카드 학습
          </button>
        )}
      </div>
    </div>
  );
}
