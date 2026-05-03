'use client';

import { useState, useEffect } from 'react';
import { FilterState, CategoryInfo } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import { Collection } from '@/types';

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  collections: Collection[];
}

export default function FilterPanel({ filters, onChange, collections }: FilterPanelProps) {
  const { categories } = useCategories();
  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial });
  }

  const allCategories: CategoryInfo[] = [
    { key: 'all', label: 'Tümü', icon: '📷', color: '#64748b' },
    ...categories,
  ];

  return (
    <div className="space-y-4">
      {/* Category chips */}
      <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar -mx-1 px-1">
        {allCategories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => update({ category: cat.key })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all haptic-tap shrink-0"
            style={{
              background: filters.category === cat.key ? 'var(--accent)' : 'var(--bg-secondary)',
              color: filters.category === cat.key ? 'var(--accent-foreground, white)' : 'var(--text-secondary)'
            }}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
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
