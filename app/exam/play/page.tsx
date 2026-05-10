'use client';

import { use, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import SpeakButton from '@/components/SpeakButton';
import { useStore, scoreToLevel } from '@/lib/store';
import { speak } from '@/lib/tts';
import vocab from '@/data/vocab.json';
import type { Word } from '@/types/word';

const ALL_WORDS = vocab as Word[];

// ── 유틸 ──────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeChoices(correct: Word, pool: Word[], labelFn: (w: Word) => string) {
  const wrongs = shuffle(pool.filter((w) => w.id !== correct.id)).slice(0, 3);
  return shuffle([correct, ...wrongs]).map((w) => ({ id: w.id, label: labelFn(w) }));
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── 문제 타입 ─────────────────────────────────────────
type QType = 'type1' | 'type2' | 'type3' | 'type4';

interface Question {
  qType: QType;
  word: Word;
  questionText: string;
  choices: { id: string; label: string }[];
  correctId: string;
}

function buildExam(words: Word[], pool: Word[], count: number): Question[] {
  const selected = shuffle(words).slice(0, count);
  const keigo = pool.filter((w) => w.category === '경어·정중어');

  // 유형 비율: I=40% II=30% III=20% IV=10%
  const targetCounts = {
    type1: Math.round(count * 0.4),
    type2: Math.round(count * 0.3),
    type3: Math.round(count * 0.2),
    type4: Math.max(Math.round(count * 0.1), keigo.length >= 4 ? Math.round(count * 0.1) : 0),
  };
  const remainder = count - Object.values(targetCounts).reduce((a, b) => a + b, 0);
  targetCounts.type1 += remainder;

  const typeQueue: QType[] = shuffle([
    ...Array(targetCounts.type1).fill('type1'),
    ...Array(targetCounts.type2).fill('type2'),
    ...Array(targetCounts.type3).fill('type3'),
    ...Array(targetCounts.type4).fill('type4'),
  ] as QType[]);

  return selected.map((word, i): Question => {
    let qType = typeQueue[i] ?? 'type1';

    // 유형 II: 예문에 단어가 포함될 때만 사용, 아니면 I로 fallback
    if (qType === 'type2' && !word.example.includes(word.japanese)) {
      qType = 'type1';
    }
    // 유형 IV: 경어 카테고리 단어 부족 시 I로 fallback
    if (qType === 'type4' && keigo.length < 4) {
      qType = 'type1';
    }

    if (qType === 'type1') {
      return {
        qType,
        word,
        questionText: word.japanese,
        choices: makeChoices(word, pool, (w) => w.korean),
        correctId: word.id,
      };
    }
    if (qType === 'type2') {
      const blanked = word.example.replace(word.japanese, '＿＿＿');
      return {
        qType,
        word,
        questionText: blanked,
        choices: makeChoices(word, pool, (w) => w.japanese),
        correctId: word.id,
      };
    }
    if (qType === 'type3') {
      return {
        qType,
        word,
        questionText: '🎧',
        choices: makeChoices(word, pool, (w) => w.korean),
        correctId: word.id,
      };
    }
    // type4: 경어 단어, 한국어 뜻 보고 경어 표현 선택
    const keigoWord = keigo.find((w) => w.id === word.id) ?? keigo[i % keigo.length];
    return {
      qType: 'type4',
      word: keigoWord,
      questionText: keigoWord.korean,
      choices: makeChoices(keigoWord, keigo, (w) => w.japanese),
      correctId: keigoWord.id,
    };
  });
}

// ── 메인 컴포넌트 ────────────────────────────────────
export default function ExamPlayPage({
  searchParams,
}: {
  searchParams: Promise<{ difficulty?: string; timeLimit?: string; count?: string }>;
}) {
  const params = use(searchParams);
  const router = useRouter();
  const difficulty = params.difficulty ?? 'J3';
  const timeLimit = parseInt(params.timeLimit ?? '1200', 10);
  const count = Math.min(parseInt(params.count ?? '20', 10), 50);

  const saveExamResult = useStore((s) => s.saveExamResult);
  const markStatus = useStore((s) => s.markStatus);
  const ttsSpeed = useStore((s) => s.settings.ttsSpeed);
  const wrongHistory = useStore((s) =>
    Object.values(s.progress).filter((p) => p.status === 'learning').map((p) => p.wordId)
  );

  // ── 문제 생성 ──
  const questions = useMemo<Question[]>(() => {
    const freqMin = difficulty === 'J5' ? 5 : difficulty === 'J4' ? 4 : 3;
    let pool = ALL_WORDS.filter((w) => w.frequency >= freqMin);
    if (pool.length < count) pool = ALL_WORDS;

    let selected = pool;
    if (difficulty === 'J2' && wrongHistory.length > 0) {
      const wrongWords = pool.filter((w) => wrongHistory.includes(w.id));
      const rest = pool.filter((w) => !wrongHistory.includes(w.id));
      selected = [...wrongWords, ...rest];
    }
    return buildExam(selected, pool, count);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [submitted, setSubmitted] = useState(false);
  const startTime = useRef(Date.now());

  // ── 타이머 ──
  useEffect(() => {
    if (submitted) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); submit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  // ── 듣기 자동 재생 ──
  useEffect(() => {
    if (!submitted && questions[idx]?.qType === 'type3') {
      speak(questions[idx].word.japanese, ttsSpeed);
    }
  }, [idx, submitted, questions, ttsSpeed]);

  const choose = (choiceId: string) => {
    setAnswers((a) => ({ ...a, [idx]: choiceId }));
  };

  const submit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);

    const timeUsed = Math.round((Date.now() - startTime.current) / 1000);
    let correct = 0;
    const byType: Record<string, { correct: number; total: number }> = {};
    const byCategory: Record<string, { correct: number; total: number }> = {};
    const wrongWordIds: string[] = [];

    questions.forEach((q, i) => {
      const isCorrect = answers[i] === q.correctId;
      if (isCorrect) correct++;
      else wrongWordIds.push(q.word.id);

      // 유형별
      const tk = `유형 ${q.qType.replace('type', '')}`;
      byType[tk] = byType[tk] ?? { correct: 0, total: 0 };
      byType[tk].total++;
      if (isCorrect) byType[tk].correct++;

      // 카테고리별
      const ck = q.word.category;
      byCategory[ck] = byCategory[ck] ?? { correct: 0, total: 0 };
      byCategory[ck].total++;
      if (isCorrect) byCategory[ck].correct++;

      // 진도 반영
      markStatus(q.word.id, isCorrect ? 'done' : 'learning');
    });

    const score = Math.round((correct / questions.length) * 100);
    const level = scoreToLevel(score);
    const id = `exam-${Date.now()}`;

    saveExamResult({
      id, date: Date.now(), score, level,
      totalQ: questions.length, correct, timeUsed, timeLimit,
      difficulty, byType, byCategory, wrongWordIds,
    });

    router.replace(`/exam/result?id=${id}`);
  }, [submitted, questions, answers, timeLimit, difficulty, saveExamResult, markStatus, router]);

  // ── 종료 확인 ──
  const quit = () => {
    const unanswered = questions.length - Object.keys(answers).length;
    if (unanswered > 0) {
      if (!confirm(`${unanswered}문제가 미답변 상태입니다. 제출하시겠습니까?`)) return;
    }
    submit();
  };

  const q = questions[idx];
  const isLowTime = timeLeft <= 60;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-3 select-none">

      {/* 상단 바 */}
      <div className="flex items-center gap-2">
        <button onClick={quit} className="text-[var(--muted-foreground)] text-sm px-2 py-1 rounded border border-[var(--border)]">
          종료
        </button>
        <div className="flex-1 flex justify-center">
          {/* 문제 번호 패널 */}
          <div className="flex gap-1 flex-wrap justify-center max-w-[280px]">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-6 h-6 rounded text-[10px] font-bold transition-all ${
                  i === idx
                    ? 'ring-2 ring-[var(--gold,#b08030)] bg-[var(--gold,#b08030)] text-white'
                    : answers[i]
                    ? 'bg-[var(--gold,#b08030)]/20 text-[var(--gold,#b08030)]'
                    : 'bg-[var(--border)] text-[var(--muted-foreground)]'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <div className={`text-sm font-mono font-bold tabular-nums ${isLowTime ? 'text-red-500 animate-pulse' : ''}`}>
          {fmt(timeLeft)}
        </div>
      </div>

      <Progress value={Math.round((answeredCount / questions.length) * 100)} className="h-1" />

      {/* 유형 배지 */}
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded bg-[var(--gold,#b08030)]/10 text-[var(--gold,#b08030)] font-mono">
          유형 {q.qType.replace('type', '')}
        </span>
        <span className="text-xs text-[var(--muted-foreground)]">
          {q.qType === 'type1' ? 'JP→KR' : q.qType === 'type2' ? '빈칸 채우기' : q.qType === 'type3' ? '듣기' : '경어 선택'}
        </span>
        <span className="ml-auto text-xs text-[var(--muted-foreground)]">{idx + 1}/{questions.length}</span>
      </div>

      {/* 문제 카드 */}
      <div className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-2xl border border-[var(--border)] p-6 min-h-[180px] flex flex-col items-center justify-center gap-3 shadow-sm">
        {q.qType === 'type3' ? (
          <>
            <p className="text-[var(--muted-foreground)] text-sm">발음을 듣고 올바른 뜻을 고르세요</p>
            <SpeakButton text={q.word.japanese} />
          </>
        ) : q.qType === 'type2' ? (
          <p className="font-ja text-xl font-bold text-center leading-relaxed">{q.questionText}</p>
        ) : q.qType === 'type4' ? (
          <>
            <p className="text-xs text-[var(--muted-foreground)]">알맞은 경어 표현을 고르세요</p>
            <p className="text-2xl font-bold text-center">{q.questionText}</p>
          </>
        ) : (
          <>
            <p className="font-ja text-4xl font-bold text-center">{q.questionText}</p>
            <p className="text-[var(--muted-foreground)]">{q.word.reading}</p>
          </>
        )}
      </div>

      {/* 보기 */}
      <div className="grid grid-cols-2 gap-2">
        {q.choices.map((choice, i) => {
          const selected = answers[idx] === choice.id;
          return (
            <button
              key={choice.id}
              onClick={() => choose(choice.id)}
              className={`relative p-4 rounded-xl border font-medium text-sm text-left transition-all active:scale-95 min-h-[64px] flex items-center gap-2 ${
                selected
                  ? 'border-[var(--gold,#b08030)] bg-[var(--gold,#b08030)]/10'
                  : 'border-[var(--border)] bg-[var(--card,#fff)] dark:bg-[#252219] hover:border-[var(--gold,#b08030)]/50'
              }`}
            >
              <span className="text-[var(--muted-foreground)] text-xs shrink-0 w-4">{i + 1}</span>
              <span className={`${q.qType === 'type2' || q.qType === 'type4' ? 'font-ja' : ''}`}>
                {choice.label}
              </span>
              {selected && <span className="absolute top-2 right-2 text-[var(--gold,#b08030)] text-xs">✓</span>}
            </button>
          );
        })}
      </div>

      {/* 이동 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-medium disabled:opacity-40"
        >
          ← 이전
        </button>
        <button
          onClick={() => {
            if (idx < questions.length - 1) setIdx((i) => i + 1);
            else quit();
          }}
          className="flex-1 py-3 rounded-xl bg-[var(--gold,#b08030)] text-white font-semibold text-sm hover:opacity-90"
        >
          {idx < questions.length - 1 ? '다음 →' : '제출 →'}
        </button>
      </div>

      <p className="text-xs text-center text-[var(--muted-foreground)]">
        {answeredCount}/{questions.length} 답변 완료 · 번호 클릭으로 이동 가능
      </p>
    </div>
  );
}
