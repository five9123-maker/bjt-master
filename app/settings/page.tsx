'use client';

import { useStore } from '@/lib/store';

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetProgress = useStore((s) => s.resetProgress);

  const toggle = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] } as any);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <h1 className="font-bold text-xl">설정</h1>

      {/* 표시 설정 */}
      <section className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-xl border border-[var(--border)] overflow-hidden">
        <h2 className="text-xs font-semibold text-[var(--muted-foreground)] px-4 pt-4 pb-2 uppercase tracking-wider">표시</h2>
        {[
          { key: 'showReading', label: '후리가나 표시', desc: '일본어 단어 위에 읽기 표시' },
          { key: 'showRomaji', label: '로마자 표시', desc: '로마자 발음 표기 표시' },
          { key: 'autoShowKr', label: '한국어 뜻 자동 표시', desc: '카드에서 바로 한국어 표시' },
          { key: 'darkMode', label: '다크 모드', desc: '어두운 테마 사용' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] first:border-0">
            <div>
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{desc}</p>
            </div>
            <button
              role="switch"
              aria-checked={!!settings[key as keyof typeof settings]}
              onClick={() => toggle(key as keyof typeof settings)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings[key as keyof typeof settings]
                  ? 'bg-[var(--gold,#b08030)]'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings[key as keyof typeof settings] ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        ))}
      </section>

      {/* TTS 속도 */}
      <section className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-xl border border-[var(--border)] p-4">
        <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">TTS 속도</h2>
        <div className="flex gap-2">
          {[0.7, 0.9, 1.0].map((v) => (
            <button
              key={v}
              onClick={() => updateSettings({ ttsSpeed: v })}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                settings.ttsSpeed === v
                  ? 'bg-[var(--gold,#b08030)] text-white border-[var(--gold,#b08030)]'
                  : 'border-[var(--border)] hover:border-[var(--gold,#b08030)]'
              }`}
            >
              {v}x
            </button>
          ))}
        </div>
      </section>

      {/* 글자 크기 */}
      <section className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-xl border border-[var(--border)] p-4">
        <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">글자 크기</h2>
        <div className="flex gap-2">
          {(['sm', 'md', 'lg'] as const).map((s) => (
            <button
              key={s}
              onClick={() => updateSettings({ fontSize: s })}
              className={`flex-1 py-2 rounded-lg border font-medium transition-colors ${
                settings.fontSize === s
                  ? 'bg-[var(--gold,#b08030)] text-white border-[var(--gold,#b08030)]'
                  : 'border-[var(--border)] hover:border-[var(--gold,#b08030)]'
              }`}
              style={{ fontSize: s === 'sm' ? '0.8rem' : s === 'md' ? '0.9rem' : '1rem' }}
            >
              {s === 'sm' ? '소' : s === 'md' ? '중' : '대'}
            </button>
          ))}
        </div>
      </section>

      {/* 데이터 */}
      <section className="bg-[var(--card,#fff)] dark:bg-[#252219] rounded-xl border border-[var(--border)] p-4">
        <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">데이터</h2>
        <button
          onClick={() => {
            if (confirm('모든 학습 진도를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
              resetProgress();
            }
          }}
          className="w-full py-3 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          학습 진도 초기화
        </button>
      </section>
    </div>
  );
}
