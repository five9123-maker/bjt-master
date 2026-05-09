export interface Word {
  id: string;
  japanese: string;
  reading: string;
  romaji: string;
  korean: string;
  example: string;
  exampleKorean: string;
  category: string;
  tags: string[];
  frequency: number;
}

export type StudyStatus = 'new' | 'learning' | 'done';

export interface UserProgress {
  wordId: string;
  status: StudyStatus;
  difficulty?: 'easy' | 'normal' | 'hard';
  lastStudied?: number;
  studyCount: number;
}

export interface DailyStats {
  date: string;
  wordsStudied: number;
  studySeconds: number;
}

export const CATEGORIES = [
  '전화·메일',
  '회의·발표',
  '업무·관리',
  '경어·정중어',
  '거래·협상',
  '그래프·수치',
  '접객·클레임',
  '보고·연락·상담',
  '채용·인사',
] as const;

export type Category = (typeof CATEGORIES)[number];
