'use client';

import { useState } from 'react';
import { usePhotos } from '@/hooks/usePhotos';
import { useCollections } from '@/hooks/useCollections';
import { useSearch } from '@/hooks/useSearch';
import { usePreferences } from '@/components/providers/PreferencesProvider';
import MasonryGrid from '@/components/photos/MasonryGrid';
import FilterPanel from '@/components/search/FilterPanel';
import EmptyState from '@/components/ui/EmptyState';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { useWatchlist } from '@/hooks/useWatchlist';
import { FilterState } from '@/types';
import Link from 'next/link';

export default function HomePage() {
  const { photos, loading } = usePhotos();
  const { collections } = useCollections();
  const { items: watchlist } = useWatchlist();
  const { prefs, updatePrefs } = usePreferences();

  const toggleDensity = () => {
    const modes = ['compact', 'normal', 'large'];
    const currentIndex = modes.indexOf(prefs.gridDensity);
    const nextMode = modes[(currentIndex + 1) % modes.length] as any;
    updatePrefs({ gridDensity: nextMode });
  };


  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    starred: null,
    collectionId: null,
    searchQuery: '',
    tags: [],
  });

  const filteredPhotos = useSearch(photos, filters);

  return (
    <div className="min-h-screen">
      {/* Dashboard Section */}
      {!loading && (
        <div className="px-4 lg:px-6 pt-10 pb-4 relative">
          <div className="mb-5 md:mb-6 animate-[fade-in_0.5s_ease-out] flex justify-between items-end">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Genel Bakış
              </h1>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Tüm verilerin tek bir ekranda.
              </p>
            </div>
            
            <button
              onClick={toggleDensity}
              className="p-2.5 rounded-full transition-all duration-300 haptic-tap shadow-sm hover:scale-105 active:scale-95"
              style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
              title="Görünümü Değiştir"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {prefs.gridDensity === 'compact' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />}
                {prefs.gridDensity === 'comfortable' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />}
                {prefs.gridDensity === 'large' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />}
              </svg>
            </button>
          </div>
          
          <DashboardStats 
            totalPhotos={photos.length}
            totalCollections={collections.length}
            totalWatchlist={watchlist.length}
          />

        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 themed-header">
        <div className="px-4 lg:px-6 py-4">
          <FilterPanel 
            filters={filters} 
            onChange={setFilters} 
            collections={collections} 
            totalPhotos={photos.length}
          />
        </div>
      </header>

      {/* Content */}
      <div className="pt-4 pb-8">
        {loading ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 px-4 lg:px-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="break-inside-avoid mb-3">
                <div className="rounded-2xl overflow-hidden">
                  <div className="skeleton aspect-[3/4]" style={{ aspectRatio: `3/${3 + (i % 3)}` }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPhotos.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            }
            title={photos.length === 0 ? 'Henüz fotoğraf yok' : 'Sonuç bulunamadı'}
            description={
              photos.length === 0
                ? 'İlk fotoğrafınızı ekleyerek başlayın!'
                : 'Filtreleri değiştirmeyi deneyin'
            }
            action={
              photos.length === 0 ? (
                <Link
                  href="/add"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium btn-accent"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Fotoğraf Ekle
                </Link>
              ) : undefined
            }
          />
        ) : (
          <MasonryGrid photos={filteredPhotos} sortBy={filters.sortBy} />
        )}
      </div>
    </div>
  );
}
