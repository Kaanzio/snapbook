'use client';

import { useState, useMemo } from 'react';
import { usePhotos } from '@/hooks/usePhotos';
import { useSearch } from '@/hooks/useSearch';
import MasonryGrid from '@/components/photos/MasonryGrid';
import { FilterState } from '@/types';
import { usePreferences } from '@/components/providers/PreferencesProvider';

export default function SearchPage() {
  const { photos, loading } = usePhotos();
  const { prefs, updatePrefs } = usePreferences();

  const toggleDensity = () => {
    const modes = ['compact', 'comfortable', 'large'];
    const currentIndex = modes.indexOf(prefs.gridDensity);
    const nextMode = modes[(currentIndex + 1) % modes.length] as 'compact' | 'comfortable' | 'large';
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

  // Get all unique tags sorted by frequency
  const popularTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    photos.forEach(p => {
      p.tags.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15) // Show top 15 tags
      .map(entry => entry[0]);
  }, [photos]);

  const toggleTag = (tag: string) => {
    setFilters(prev => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  };

  const isSearching = filters.searchQuery.trim().length > 0 || filters.tags.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Search Header / Spotlight Area */}
      <div 
        className={`w-full flex flex-col items-center px-4 lg:px-6 transition-all duration-500 ease-in-out ${
          isSearching ? 'pt-6 pb-6 sticky top-0 z-30' : 'pt-[30vh] pb-10'
        }`}
        style={isSearching ? { background: 'var(--bg-nav)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } : {}}
      >
        <h1 
          className={`font-black tracking-tight transition-all duration-300 ${
            isSearching ? 'text-2xl mb-4' : 'text-5xl md:text-6xl mb-8'
          }`}
          style={{ color: 'var(--text-primary)' }}
        >
          Ara
        </h1>
        
        <div className={`w-full transition-all duration-300 ${isSearching ? 'max-w-3xl' : 'max-w-xl'}`}>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <svg className="h-6 w-6 text-slate-400 group-focus-within:text-accent transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Notlarda veya etiketlerde ara..."
              className="block w-full pl-14 pr-6 py-4 rounded-2xl text-lg font-medium outline-none transition-all duration-200 themed-input"
              style={{
                boxShadow: isSearching ? 'var(--shadow-sm)' : 'var(--shadow-lg)'
              }}
            />
          </div>

          {/* Popular Tags */}
          {!isSearching && popularTags.length > 0 && (
            <div className="mt-8 animate-[fade-in_0.3s_ease-out]">
              <p className="text-center text-xs font-bold uppercase tracking-widest mb-4 opacity-50" style={{ color: 'var(--text-primary)' }}>
                Sık Kullanılan Etiketler
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-transform active:scale-95 haptic-tap"
                    style={{
                      background: filters.tags.includes(tag) ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: filters.tags.includes(tag) ? 'var(--accent-foreground, white)' : 'var(--text-secondary)'
                    }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-6 pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-sm font-medium animate-pulse" style={{ color: 'var(--text-tertiary)' }}>Sonuçlar taranıyor...</p>
          </div>
        ) : filteredPhotos.length === 0 && isSearching ? (
          <div className="py-20 text-center animate-[fade-in_0.5s_ease-out]">
            <div className="flex justify-center mb-6">
              <div className="p-5 rounded-full bg-black/5 dark:bg-white/5 text-accent/50">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Eşleşme Bulunamadı</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Farklı bir kelime veya etiket deneyin.</p>
          </div>
        ) : isSearching && (
          <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div className="flex flex-wrap items-center gap-2">
                {filters.tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-accent-soft text-accent text-xs font-bold transition-opacity hover:opacity-80 haptic-tap"
                  >
                    #{tag}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ))}
              </div>
              <div className="self-start sm:self-auto flex items-center gap-3">
                <button
                  onClick={toggleDensity}
                  className="p-1.5 rounded-full transition-colors haptic-tap hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Görünümü Değiştir"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {prefs.gridDensity === 'compact' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />}
                    {prefs.gridDensity === 'comfortable' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />}
                    {prefs.gridDensity === 'large' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />}
                  </svg>
                </button>
                <span className="px-2 py-1 rounded-lg bg-accent-soft text-accent text-[10px] font-black uppercase tracking-tight">
                  {filteredPhotos.length} FOTOĞRAF
                </span>
              </div>
            </div>
            
            <div className="animate-[fade-in_0.5s_ease-out]">
              <MasonryGrid photos={filteredPhotos} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
