'use client';

import { useState } from 'react';

export interface SortOption<T extends string = string> {
  key: T;
  label: string;
}

interface FloatingFilterSortProps<T extends string = string> {
  sortOptions?: SortOption<T>[];
  currentSort?: T;
  onSelectSort?: (key: T) => void;
  onOpenFilter?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export default function FloatingFilterSort<T extends string = string>({
  sortOptions,
  currentSort,
  onSelectSort,
  onOpenFilter,
  hasActiveFilters = false,
  className = '',
}: FloatingFilterSortProps<T>) {
  const [isSortOpen, setIsSortOpen] = useState(false);

  return (
    <div
      className={`fixed bottom-20 lg:bottom-8 right-4 sm:right-6 z-40 transition-all ${className}`}
    >
      {/* Click-away Backdrop for Sort Menu */}
      {isSortOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsSortOpen(false)}
        />
      )}

      {/* Sort Popover Menu */}
      {isSortOpen && sortOptions && onSelectSort && (
        <div
          className="absolute bottom-full right-0 mb-2.5 w-52 sm:w-56 rounded-2xl p-1.5 border shadow-2xl z-50 animate-[fadeIn_0.15s_ease-out]"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-primary)',
            boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Sıralama Ölçütü
          </div>
          <div className="space-y-0.5">
            {sortOptions.map((opt) => {
              const isSelected = currentSort === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    onSelectSort(opt.key);
                    setIsSortOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left haptic-tap cursor-pointer ${
                    isSelected
                      ? 'bg-accent/15 text-accent font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-accent shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Island Pill */}
      <div
        className="flex items-center p-1 rounded-2xl border shadow-xl backdrop-blur-xl relative z-40 transition-transform duration-200"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-secondary)',
          boxShadow: '0 12px 36px -6px rgba(0, 0, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Sort Trigger Button */}
        {sortOptions && onSelectSort && (
          <button
            type="button"
            onClick={() => setIsSortOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all haptic-tap cursor-pointer ${
              isSortOpen
                ? 'bg-accent text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Sıralama Seçenekleri"
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
              />
            </svg>
            <span>Sırala</span>
          </button>
        )}

        {/* Divider if both exist */}
        {sortOptions && onSelectSort && onOpenFilter && (
          <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-0.5 shrink-0" />
        )}

        {/* Filter Trigger Button */}
        {onOpenFilter && (
          <button
            type="button"
            onClick={onOpenFilter}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all haptic-tap cursor-pointer ${
              hasActiveFilters
                ? 'text-accent'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Filtreleme Seçenekleri"
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
              />
            </svg>
            <span>Filtrele</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-accent shrink-0 animate-pulse" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
