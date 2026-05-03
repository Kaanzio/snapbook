'use client';

import { useState } from 'react';
import { usePhotos } from '@/hooks/usePhotos';
import { useCollections } from '@/hooks/useCollections';
import { useSearch } from '@/hooks/useSearch';
import MasonryGrid from '@/components/photos/MasonryGrid';
import FilterPanel from '@/components/search/FilterPanel';
import EmptyState from '@/components/ui/EmptyState';
import { FilterState } from '@/types';
import Link from 'next/link';

export default function HomePage() {
  const { photos, loading } = usePhotos();
  const { collections } = useCollections();
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
