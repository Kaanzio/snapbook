'use client';

import { useState } from 'react';
import { usePhotos } from '@/hooks/usePhotos';
import { useCollections } from '@/hooks/useCollections';
import { useSearch } from '@/hooks/useSearch';
import { usePreferences } from '@/components/providers/PreferencesProvider';
import MasonryGrid from '@/components/photos/MasonryGrid';
import FilterPanel from '@/components/search/FilterPanel';
import EmptyState from '@/components/ui/EmptyState';
import { FilterState } from '@/types';
import Link from 'next/link';

export default function HomePage() {
  const { photos, loading } = usePhotos();
  const { collections } = useCollections();
  const { prefs, updatePrefs } = usePreferences();

  const toggleDensity = () => {
    const modes = ['compact', 'normal', 'large'];
    const currentIndex = modes.indexOf(prefs.gridDensity);
    const nextMode = modes[(currentIndex + 1) % modes.length] as any;
    updatePrefs({ gridDensity: nextMode });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'İyi geceler.';
    if (hour < 12) return 'Günaydın.';
    if (hour < 18) return 'İyi günler.';
    return 'İyi akşamlar.';
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
      {/* Hero Section */}
      {!loading && photos.length > 0 && (
        <div className="px-4 lg:px-6 pt-10 pb-6 animate-[fade-in_1s_ease-out] relative flex items-start justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {getGreeting()}
            </h1>
            <p className="text-base md:text-lg mt-2 font-medium" style={{ color: 'var(--text-tertiary)' }}>
              Burada toplam <span style={{ color: 'var(--accent)' }}>{photos.length} anı</span> biriktirdin.
            </p>
          </div>
          
          <button
            onClick={toggleDensity}
            className="p-2.5 mt-2 rounded-full transition-colors haptic-tap shadow-sm"
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
            icon="📸"
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
          <MasonryGrid photos={filteredPhotos} />
        )}
      </div>
    </div>
  );
}
