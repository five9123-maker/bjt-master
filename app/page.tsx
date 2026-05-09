'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Progress } from '@/components/ui/progress';
import vocab from '@/data/vocab.json';
import { CATEGORIES } from '@/types/word';
import type { Word } from '@/types/word';

const words = vocab as Word[];
const total = words.length;

function fmt(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

export default function HomePage() {
  const progress = useStore((s) => s.progress);
  const dailyStats = useStore((s) => s.dailyStats);
  const streak = useStore((s) => s.streak);
  const totalStudySeconds = useStore((s) => s.totalStudySeconds);

  const done = Object.values(progress).filter((p) => p.status === 'done').length;
  const learning = Object.values(progress).filter((p) => p.status === 'learning').length;
  const pct = Math.round((done / total) * 100);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayStat = dailyStats.find((d) => d.date === todayStr);
  const todayWords = todayStat?.wordsStudied ?? 0;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const stat = dailyStats.find((x) => x.date === key);
    return { key, sec: stat?.studySeconds ?? 0 };
  });
  const maxSec = Math.max(...last7.map((x) => x.sec), 1);

  const catStats = CATEGORIES.map((cat) => {
    const catWords = words.filter((w) => w.category === cat);
    const catDone = catWords.filter((w) => progress[w.id]?.status === 'done').length;
    return { cat, total: catWords.length, done: catDone };
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <header>
        <h1 className="font-ja text-2xl font-bold">BJT Master</h1>
        <p className="text-sm text-[var(--muted-foreground)]">비즈니스 일본어 단어장</p>
      </header>

      {/* 전체 진도 */}
      <section className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-xl p-5 shadow-sm border border-[var(--border)]">
        <div className="flex justify-between items-baseline mb-2">
          <span className="font-semibold">전체 진도</span>
          <span className="text-2xl font-bold text-[var(--gold,#b08030)]">{pct}%</span>
        </div>
        <Progress value={pct} className="h-3 mb-3" />
        <div className="flex gap-4 text-sm text-[var(--muted-foreground)]">
          <span>전체 {total}개</span>
          <span className="text-green-600 dark:text-green-400">✓ 완료 {done}개</span>
          <span className="text-blue-600 dark:text-blue-400">학습중 {learning}개</span>
        </div>
      </section>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '오늘 학습', value: `${todayWords}개`, icon: '📖' },
          { label: '연속 학습', value: `${streak}일`, icon: '🔥' },
          { label: '누적 시간', value: fmt(totalStudySeconds), icon: '⏱️' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-xl p-3 text-center shadow-sm border border-[var(--border)]">
            <div className="text-2xl">{icon}</div>
            <div className="font-bold text-lg leading-tight">{value}</div>
            <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
          </div>
        ))}
      </div>

      {/* 최근 7일 히스토리 */}
      <section className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-xl p-4 shadow-sm border border-[var(--border)]">
        <h2 className="font-semibold mb-3 text-sm">최근 7일 학습</h2>
        <div className="flex gap-1 items-end h-16">
          {last7.map(({ key, sec }) => {
            const h = Math.round((sec / maxSec) * 100);
            const isToday = key === todayStr;
            return (
              <div key={key} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${Math.max(h, sec > 0 ? 8 : 2)}%`,
                    backgroundColor: isToday ? 'var(--gold,#b08030)' : sec > 0 ? '#b0803060' : '#e5e5e5',
                  }}
                />
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  {new Date(key).getDate()}일
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 카테고리별 진도 */}
      <section className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-xl p-4 shadow-sm border border-[var(--border)]">
        <h2 className="font-semibold mb-3 text-sm">카테고리별 진도</h2>
        <div className="space-y-2">
          {catStats.map(({ cat, total: t, done: d }) => (
            <div key={cat}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--muted-foreground)]">{cat}</span>
                <span>{d}/{t}</span>
              </div>
              <Progress value={Math.round((d / t) * 100)} className="h-1.5" />
            </div>
          ))}
        </div>
      </section>

      {/* 빠른 이동 */}
      <div className="grid grid-cols-2 gap-3 pb-2">
        <Link
          href="/learn"
          className="bg-[var(--gold,#b08030)] text-white rounded-xl p-4 font-semibold text-center shadow-sm hover:opacity-90 transition-opacity"
        >
          📚 단어 목록
        </Link>
        <Link
          href="/learn/flip"
          className="bg-[var(--card,#fff)] dark:bg-[#252219] border border-[var(--border)] rounded-xl p-4 font-semibold text-center shadow-sm hover:bg-[var(--gold,#b08030)]/10 transition-colors"
        >
          🃏 플립카드
        </Link>
      </div>
    </div>
  );
}
