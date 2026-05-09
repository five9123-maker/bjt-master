'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '@/types/word';

type QuizType = 'jp-to-kr' | 'kr-to-jp' | 'listening';

const QUIZ_TYPES: { value: QuizType; label: string; desc: string; icon: string }[] = [
  { value: 'jp-to-kr', label: '일본어 → 한국어', desc: '일본어 단어를 보고 뜻을 고르세요', icon: '🇯🇵' },
  { value: 'kr-to-jp', label: '한국어 → 일본어', desc: '한국어 뜻을 보고 일본어를 고르세요', icon: '🇰🇷' },
  { value: 'listening', label: '듣기', desc: '발음을 듣고 뜻을 고르세요', icon: '🎧' },
];

const COUNTS = [10, 20, 30];

export default function QuizSetupPage() {
  const router = useRouter();
  const [type, setType] = useState<QuizType>('jp-to-kr');
  const [category, setCategory] = useState('전체');
  const [count, setCount] = useState(10);

  const start = () => {
    const params = new URLSearchParams({ type, category, count: String(count) });
    router.push(`/quiz/play?${params}`);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <header>
        <h1 className="font-bold text-xl">퀴즈 모드</h1>
        <p className="text-sm text-[var(--muted-foreground)]">설정을 선택하고 시작하세요</p>
      </header>

      {/* 문제 유형 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">문제 유형</h2>
        <div className="space-y-2">
          {QUIZ_TYPES.map((q) => (
            <button
              key={q.value}
              onClick={() => setType(q.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                type === q.value
                  ? 'border-[var(--gold,#b08030)] bg-[var(--gold,#b08030)]/10'
                  : 'border-[var(--border)] bg-[var(--card,#fff)] dark:bg-[#252219] hover:border-[var(--gold,#b08030)]/50'
              }`}
            >
              <span className="text-2xl">{q.icon}</span>
              <div>
                <p className="font-semibold text-sm">{q.label}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{q.desc}</p>
              </div>
              {type === q.value && (
                <span className="ml-auto text-[var(--gold,#b08030)] text-lg">✓</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* 카테고리 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">카테고리</h2>
        <div className="flex flex-wrap gap-2">
          {['전체', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                category === cat
                  ? 'bg-[var(--gold,#b08030)] text-white border-[var(--gold,#b08030)]'
                  : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--gold,#b08030)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 문제 수 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">문제 수</h2>
        <div className="flex gap-2">
          {COUNTS.map((c) => (
            <button
              key={c}
              onClick={() => setCount(c)}
              className={`flex-1 py-3 rounded-xl border font-semibold text-sm transition-colors ${
                count === c
                  ? 'bg-[var(--gold,#b08030)] text-white border-[var(--gold,#b08030)]'
                  : 'border-[var(--border)] bg-[var(--card,#fff)] dark:bg-[#252219] hover:border-[var(--gold,#b08030)]'
              }`}
            >
              {c}문제
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={start}
        className="w-full py-4 rounded-xl bg-[var(--gold,#b08030)] text-white font-bold text-lg shadow-md hover:opacity-90 active:scale-95 transition-all"
      >
        퀴즈 시작 →
      </button>
    </div>
  );
}
