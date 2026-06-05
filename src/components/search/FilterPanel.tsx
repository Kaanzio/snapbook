'use client';

import { useEffect, useRef } from 'react';
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
      {/* Category Selection - Compact Segmented Control */}
      <div 
        ref={scrollRef}
        className="block w-full overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 lg:-mx-6 lg:px-6"
      >
        <div className="inline-flex min-w-max p-1 rounded-[14px] border" 
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
      </div>

      {/* Starred + Collection row */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => update({ starred: filters.starred ? null : true })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all haptic-tap"
          style={{
            background: filters.starred ? 'var(--accent)' : 'var(--bg-secondary)',
            color: filters.starred ? 'var(--accent-foreground, white)' : 'var(--text-secondary)'
          }}
        >
          <svg className="w-3.5 h-3.5" fill={filters.starred ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          Favoriler
        </button>

        {/* Sort menu */}
        <select
          value={filters.sortBy || 'date_desc'}
          onChange={(e) => update({ sortBy: e.target.value as PhotoSortOption })}
          className="px-3 py-1.5 rounded-full text-xs font-medium themed-input cursor-pointer"
        >
          <option value="date_desc">En Yeni</option>
          <option value="date_asc">En Eski</option>
          <option value="note_asc">İsme Göre (A-Z)</option>
          <option value="note_desc">İsme Göre (Z-A)</option>
        </select>

        {totalPhotos !== undefined && (
          <span className="ml-auto text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--text-primary)' }}>
            {totalPhotos} FOTOĞRAF
          </span>
        )}

        {collections.length > 0 && (
          <select
            value={filters.collectionId || ''}
            onChange={(e) => update({ collectionId: e.target.value || null })}
            className="px-3 py-1.5 rounded-full text-xs font-medium themed-input cursor-pointer"
          >
            <option value="">Tüm Koleksiyonlar</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
