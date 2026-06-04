'use client';

import { useState } from 'react';
import { usePhotos } from '@/hooks/usePhotos';
import { useCollections } from '@/hooks/useCollections';
import { useSearch } from '@/hooks/useSearch';
import MasonryGrid from '@/components/photos/MasonryGrid';
import SearchBar from '@/components/search/SearchBar';
import FilterPanel from '@/components/search/FilterPanel';
import EmptyState from '@/components/ui/EmptyState';
import { FilterState } from '@/types';

export default function SearchPage() {
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar Filters (Desktop) */}
      <aside className="hidden lg:block w-80 shrink-0 sticky top-0 h-screen border-r themed-header p-6 overflow-y-auto" style={{ borderColor: 'var(--border-secondary)' }}>
        <h1 className="text-2xl font-black mb-8" style={{ color: 'var(--text-primary)' }}>Ara</h1>
        
        <div className="space-y-8">
          <section>
            <label className="block text-xs font-bold uppercase tracking-widest mb-4 opacity-50" style={{ color: 'var(--text-primary)' }}>Arama Terimi</label>
            <SearchBar
              value={filters.searchQuery}
              onChange={(searchQuery) => setFilters((prev) => ({ ...prev, searchQuery }))}
            />
          </section>

          <section>
            <label className="block text-xs font-bold uppercase tracking-widest mb-4 opacity-50" style={{ color: 'var(--text-primary)' }}>Filtreler</label>
            <FilterPanel filters={filters} onChange={setFilters} collections={collections} />
          </section>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 themed-header p-4 space-y-3">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Ara</h1>
          <SearchBar
            value={filters.searchQuery}
            onChange={(searchQuery) => setFilters((prev) => ({ ...prev, searchQuery }))}
          />
          <div className="overflow-x-auto pb-1">
            <FilterPanel filters={filters} onChange={setFilters} collections={collections} />
          </div>
        </header>

        {/* Results */}
        <div className="flex-1 p-4 lg:p-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
              <p className="text-sm font-medium animate-pulse" style={{ color: 'var(--text-tertiary)' }}>Sonuçlar taranıyor...</p>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="py-20">
              <EmptyState
                icon="🔍"
                title="Eşleşme Bulunamadı"
                description={
                  filters.searchQuery
                    ? `"${filters.searchQuery}" terimi için sonuç yok.`
                    : 'Aramanızı detaylandırmak için filtreleri kullanın.'
                }
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-secondary)' }}>
                <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Arama Sonuçları
                </h2>
                <span className="px-2 py-1 rounded-lg bg-accent-soft text-accent text-[10px] font-black uppercase tracking-tight">
                  {filteredPhotos.length} FOTOĞRAF
                </span>
              </div>
              
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <MasonryGrid photos={filteredPhotos} forceCompact />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
