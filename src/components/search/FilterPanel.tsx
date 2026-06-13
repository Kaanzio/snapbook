'use client';

import { useEffect, useRef, useState } from 'react';
import { FilterState, CategoryInfo, PhotoSortOption } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import { Collection } from '@/types';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  collections: Collection[];
  totalPhotos?: number;
}

export default function FilterPanel({ filters, onChange, collections, totalPhotos }: FilterPanelProps) {
  const { categories } = useCategories();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const handleWheel = (e: WheelEvent) => {
      // Dikey kaydırmayı yatay kaydırmaya çevir (masaüstü için)
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial });
  }

  const allCategories: (CategoryInfo | { key: string; label: string; icon: string | null; color: string })[] = [
    { key: 'all', label: 'Tümü', icon: null, color: '#64748b' },
    ...categories,
  ];

  return (
    <div className="space-y-4">
      {/* Unified Filter Bar - Horizontal Scroll */}
      <div 
        ref={scrollRef}
        className="block w-full overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 lg:-mx-6 lg:px-6"
      >
        {/* Row Container */}
        <div className="flex items-center min-w-full w-max gap-4">
          
          {/* 1. Category Selection Box */}
          <div className="inline-flex items-center p-1 rounded-[14px] border shrink-0" 
               style={{ 
                 background: 'var(--bg-secondary)', 
                 borderColor: 'var(--border-primary)' 
               }}>
            {allCategories.map((cat) => {
              const isActive = filters.category === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => update({ category: cat.key })}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-[11px] uppercase tracking-wider font-bold transition-all duration-300 haptic-tap shrink-0 ${
                    isActive ? '' : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{
                    background: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? 'var(--accent-foreground, white)' : 'var(--text-secondary)',
                  }}
                >
                  {cat.key === 'all' ? (
                    <svg className={`w-3.5 h-3.5 ${isActive ? 'opacity-100' : 'opacity-60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                  ) : (
                    <CategoryIcon categoryKey={cat.key} className={`w-3.5 h-3.5 ${isActive ? 'opacity-100' : 'opacity-60'}`} />
                  )}
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Spacer to push the rest to the right */}
          <div className="flex-1" />

          {/* 2. Right Side Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Favorites */}
            <button
              onClick={() => update({ starred: filters.starred ? null : true })}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold transition-all duration-300 haptic-tap shrink-0 border ${
                filters.starred ? 'border-transparent shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{
                background: filters.starred ? 'var(--accent)' : 'var(--bg-secondary)',
                borderColor: filters.starred ? 'transparent' : 'var(--border-primary)',
                color: filters.starred ? 'var(--accent-foreground, white)' : 'var(--text-secondary)',
              }}
            >
              <svg className={`w-3.5 h-3.5 ${filters.starred ? 'opacity-100' : 'opacity-60'}`} fill={filters.starred ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              Favoriler
            </button>

            {/* Sort Menu */}
            <div className="relative flex items-center border rounded-full haptic-tap transition-all hover:bg-black/5 dark:hover:bg-white/5" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
              <select
                value={filters.sortBy || 'date_desc'}
                onChange={(e) => update({ sortBy: e.target.value as PhotoSortOption })}
                className="appearance-none inline-flex items-center gap-1.5 pl-4 pr-8 py-1.5 text-[11px] uppercase tracking-wider font-bold bg-transparent cursor-pointer outline-none shrink-0"
                style={{ color: 'var(--text-secondary)' }}
              >
                <option value="date_desc" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>En Yeni</option>
                <option value="date_asc" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>En Eski</option>
                <option value="note_asc" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>İsme Göre (A-Z)</option>
                <option value="note_desc" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>İsme Göre (Z-A)</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-3 pointer-events-none opacity-60" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Collection Menu */}
            {collections.length > 0 && (
              <div className="relative flex items-center border rounded-full haptic-tap transition-all hover:bg-black/5 dark:hover:bg-white/5 ml-2" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                <select
                  value={filters.collectionId || ''}
                  onChange={(e) => update({ collectionId: e.target.value || null })}
                  className="appearance-none inline-flex items-center gap-1.5 pl-4 pr-8 py-1.5 text-[11px] uppercase tracking-wider font-bold bg-transparent cursor-pointer outline-none shrink-0"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <option value="" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Koleksiyonlar</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{c.name}</option>
                  ))}
                </select>
                <svg className="w-3.5 h-3.5 absolute right-3 pointer-events-none opacity-60" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
