'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProgress, DailyStats, StudyStatus } from '@/types/word';

interface Settings {
  showReading: boolean;
  showRomaji: boolean;
  autoShowKr: boolean;
  ttsSpeed: number;
  darkMode: boolean;
  fontSize: 'sm' | 'md' | 'lg';
}

interface AppState {
  progress: Record<string, UserProgress>;
  dailyStats: DailyStats[];
  streak: number;
  totalStudySeconds: number;
  settings: Settings;
  updateProgress: (wordId: string, update: Partial<UserProgress>) => void;
  markStatus: (wordId: string, status: StudyStatus) => void;
  addStudyTime: (seconds: number) => void;
  resetProgress: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

const defaultSettings: Settings = {
  showReading: true,
  showRomaji: true,
  autoShowKr: false,
  ttsSpeed: 1.0,
  darkMode: false,
  fontSize: 'md',
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      progress: {},
      dailyStats: [],
      streak: 0,
      totalStudySeconds: 0,
      settings: defaultSettings,

      updateProgress: (wordId, update) => {
        set((s) => ({
          progress: {
            ...s.progress,
            [wordId]: {
              ...{ studyCount: 0, status: 'new' as const },
              ...s.progress[wordId],
              wordId,
              ...update,
              lastStudied: Date.now(),
            },
          },
        }));
      },

      markStatus: (wordId, status) => {
        const prev = get().progress[wordId];
        set((s) => ({
          progress: {
            ...s.progress,
            [wordId]: {
              ...{ wordId, studyCount: (prev?.studyCount ?? 0) + 1 },
              ...prev,
              status,
              lastStudied: Date.now(),
            },
          },
        }));
      },

      addStudyTime: (seconds) => {
        const dateStr = today();
        set((s) => {
          const existing = s.dailyStats.find((d) => d.date === dateStr);
          const dailyStats = existing
            ? s.dailyStats.map((d) =>
                d.date === dateStr
                  ? { ...d, studySeconds: d.studySeconds + seconds, wordsStudied: d.wordsStudied }
                  : d
              )
            : [...s.dailyStats, { date: dateStr, wordsStudied: 0, studySeconds: seconds }];

          const sorted = [...dailyStats].sort((a, b) => a.date.localeCompare(b.date));
          let streak = 0;
          const d = new Date();
          for (let i = 0; i < 365; i++) {
            const ds = new Date(d);
            ds.setDate(d.getDate() - i);
            const key = ds.toISOString().slice(0, 10);
            if (sorted.find((x) => x.date === key && x.studySeconds > 0)) {
              streak++;
            } else if (i > 0) {
              break;
            }
          }

          return {
            dailyStats,
            streak,
            totalStudySeconds: s.totalStudySeconds + seconds,
          };
        });
      },

      resetProgress: () => set({ progress: {}, dailyStats: [], streak: 0, totalStudySeconds: 0 }),

      updateSettings: (settings) =>
        set((s) => ({ settings: { ...s.settings, ...settings } })),
    }),
    { name: 'bjt-master:store' }
  )
);
