'use client';

import { useEffect, useRef } from 'react';
import { FilterState, CategoryInfo } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import { Collection } from '@/types';

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

  const allCategories: CategoryInfo[] = [
    { key: 'all', label: 'Tümü', icon: '📷', color: '#64748b' },
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
                <span className={isActive ? 'opacity-100' : 'opacity-60'}>{cat.icon}</span>
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
          ⭐ Favoriler
        </button>

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
