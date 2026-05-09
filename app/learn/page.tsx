'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WordCard from '@/components/WordCard';
import vocab from '@/data/vocab.json';
import { CATEGORIES } from '@/types/word';
import type { Word } from '@/types/word';
import { useStore } from '@/lib/store';

const words = vocab as Word[];

type SortMode = 'category' | 'frequency' | 'new-first';

export default function LearnPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('전체');
  const [sort, setSort] = useState<SortMode>('category');
  const progress = useStore((s) => s.progress);

  const filtered = useMemo(() => {
    let list = words;
    if (activeTab !== '전체') list = list.filter((w) => w.category === activeTab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (w) =>
          w.japanese.includes(q) ||
          w.reading.includes(q) ||
          w.korean.includes(q) ||
          w.romaji.toLowerCase().includes(q)
      );
    }
    if (sort === 'frequency') {
      list = [...list].sort((a, b) => b.frequency - a.frequency);
    } else if (sort === 'new-first') {
      list = [...list].sort((a, b) => {
        const sa = progress[a.id]?.status ?? 'new';
        const sb = progress[b.id]?.status ?? 'new';
        const order = { new: 0, learning: 1, done: 2 };
        return order[sa] - order[sb];
      });
    }
    return list;
  }, [search, activeTab, sort, progress]);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="font-bold text-xl">단어 목록</h1>
        <span className="text-sm text-[var(--muted-foreground)]">{filtered.length}개</span>
      </header>

      <Input
        placeholder="일본어 / 한국어 / 후리가나로 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-11"
      />

      {/* 정렬 */}
      <div className="flex gap-2">
        {(['category', 'frequency', 'new-first'] as SortMode[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              sort === s
                ? 'bg-[var(--gold,#b08030)] text-white border-[var(--gold,#b08030)]'
                : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--gold,#b08030)]'
            }`}
          >
            {s === 'category' ? '카테고리순' : s === 'frequency' ? '빈도순' : '미학습 우선'}
          </button>
        ))}
      </div>

      {/* 카테고리 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-nowrap overflow-x-auto w-full h-auto gap-1 bg-transparent p-0 justify-start">
          {['전체', ...CATEGORIES].map((cat) => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full data-[state=active]:bg-[var(--gold,#b08030)] data-[state=active]:text-white shrink-0"
            >
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* 단어 목록 */}
      <div className="space-y-3 pb-4">
        {filtered.length === 0 ? (
          <p className="text-center text-[var(--muted-foreground)] py-12">검색 결과가 없습니다.</p>
        ) : (
          filtered.map((word) => <WordCard key={word.id} word={word} />)
        )}
      </div>
    </div>
  );
}
