'use client';

import { useState, useEffect } from 'react';
import { 
  getTrendingTMDB, 
  getPopularMoviesTMDB, 
  getPopularSeriesTMDB, 
  getTopRatedTMDB,
  getTMDBDetails,
  getTMDBImageUrl,
  getTMDBBackdropUrl,
  TMDBResult,
  TMDBDetails
} from '@/lib/tmdb';
import { useWatchlist } from '@/hooks/useWatchlist';
import { showToast } from '@/components/ui/Toast';
import HeroBillboard from './HeroBillboard';
import { motion, AnimatePresence } from 'framer-motion';

type DiscoverCategory = 'trending' | 'popular_movies' | 'popular_series' | 'top_rated';

const CATEGORIES: { id: DiscoverCategory; label: string; icon: string }[] = [
  { id: 'trending', label: 'Haftanın Trendleri', icon: '🔥' },
  { id: 'popular_movies', label: 'Popüler Filmler', icon: '🎬' },
  { id: 'popular_series', label: 'Popüler Diziler', icon: '📺' },
  { id: 'top_rated', label: 'En İyiler', icon: '⭐' },
];

export default function DiscoverView({ 
  onOpenItemModal 
}: { 
  onOpenItemModal?: (id: string) => void 
}) {
  const { items, addItem } = useWatchlist();
  const [activeCategory, setActiveCategory] = useState<DiscoverCategory>('trending');
  const [results, setResults] = useState<TMDBResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  // Preview Modal for TMDB Item
  const [previewItem, setPreviewItem] = useState<TMDBDetails | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Fetch items when category changes
  useEffect(() => {
    let isCancelled = false;
    async function fetchData() {
      setLoading(true);
      setHeroIndex(0);
      let data: TMDBResult[] = [];
      try {
        if (activeCategory === 'trending') data = await getTrendingTMDB(1);
        else if (activeCategory === 'popular_movies') data = await getPopularMoviesTMDB(1);
        else if (activeCategory === 'popular_series') data = await getPopularSeriesTMDB(1);
        else if (activeCategory === 'top_rated') data = await getTopRatedTMDB(1);
      } catch (err) {
        console.error('Fetch error:', err);
      }
      if (!isCancelled) {
        setResults(data);
        setLoading(false);
      }
    }
    fetchData();
    return () => { isCancelled = true; };
  }, [activeCategory]);

  // Check if a TMDB item is already in user watchlist
  const isItemInWatchlist = (tmdbId: number) => {
    return items.some(item => item.tmdbId === tmdbId);
  };

  const getExistingItemId = (tmdbId: number) => {
    return items.find(item => item.tmdbId === tmdbId)?.id;
  };

  // Add TMDB item to user watchlist
  const handleAddToList = async (tmdb: TMDBResult) => {
    if (addingId === tmdb.id) return;
    setAddingId(tmdb.id);

    try {
      // Fetch full details for runtime, seasons, trailer etc.
      const details = await getTMDBDetails(tmdb.id, tmdb.media_type);
      const title = (details?.title || details?.name || tmdb.title || tmdb.name || 'İsimsiz').trim();
      
      let trailerUrl: string | undefined = undefined;
      if (details?.videos?.results) {
        const trTrailers = details.videos.results.filter(v => v.site === 'YouTube' && v.type === 'Trailer' && v.iso_639_1 === 'tr');
        const enTrailers = details.videos.results.filter(v => v.site === 'YouTube' && v.type === 'Trailer');
        const anyVideo = details.videos.results.filter(v => v.site === 'YouTube');
        const video = trTrailers[0] || enTrailers[0] || anyVideo[0];
        if (video) trailerUrl = `https://www.youtube.com/watch?v=${video.key}`;
      }

      const releaseDate = details?.release_date || details?.first_air_date || tmdb.release_date || tmdb.first_air_date;
      const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : undefined;
      const primaryGenre = details?.genres?.[0]?.name;

      const newId = await addItem({
        title,
        type: tmdb.media_type === 'tv' ? 'series' : 'movie',
        status: 'planned',
        rating: tmdb.vote_average ? Number(tmdb.vote_average.toFixed(1)) : undefined,
        releaseYear,
        duration: details?.runtime || details?.episode_run_time?.[0] || undefined,
        description: details?.overview?.trim() || tmdb.overview?.trim() || undefined,
        tags: [],
        listIds: [],
        totalSeasons: details?.number_of_seasons || undefined,
        totalEpisodes: details?.number_of_episodes || undefined,
        posterUrl: getTMDBImageUrl(details?.poster_path || tmdb.poster_path) || undefined,
        backdropUrl: getTMDBBackdropUrl(details?.backdrop_path || tmdb.backdrop_path) || undefined,
        tmdbId: tmdb.id,
        trailerUrl,
      });

      showToast(`"${title}" listene eklendi!`);
    } catch (err) {
      console.error('Add to watchlist error:', err);
      showToast('Eklenirken bir hata oluştu', 'error');
    } finally {
      setAddingId(null);
    }
  };

  // Open full preview modal
  const handleOpenPreview = async (tmdb: TMDBResult) => {
    setLoadingPreview(true);
    const details = await getTMDBDetails(tmdb.id, tmdb.media_type);
    if (details) {
      setPreviewItem(details);
    }
    setLoadingPreview(false);
  };

  const heroItem = results.length > 0 ? results[heroIndex % results.length] : null;

  return (
    <div className="space-y-6">
      {/* Category Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-1 py-1">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all haptic-tap cursor-pointer border ${
                isActive 
                  ? 'bg-accent text-white border-accent shadow-md shadow-accent/20 scale-[1.02]' 
                  : 'border-white/10 text-white/70 hover:text-white hover:border-white/20'
              }`}
              style={{ background: isActive ? 'var(--accent)' : 'var(--bg-secondary)' }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Hero Billboard for #1 Trending */}
      {!loading && heroItem && (
        <HeroBillboard
          tmdbItem={heroItem}
          isAdded={isItemInWatchlist(heroItem.id)}
          isAdding={addingId === heroItem.id}
          onAddToList={handleAddToList}
          onNext={() => setHeroIndex(idx => (idx + 1) % results.length)}
        />
      )}

      {/* Items Grid */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-sm font-bold tracking-widest uppercase flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span>{CATEGORIES.find(c => c.id === activeCategory)?.label}</span>
            <span className="text-xs font-normal opacity-50">({results.length} içerik)</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
              <div key={i} className="aspect-[2/3] rounded-2xl skeleton" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
            {results.map(item => {
              const inWatchlist = isItemInWatchlist(item.id);
              const posterUrl = getTMDBImageUrl(item.poster_path);
              const title = item.title || item.name || 'İsimsiz';
              const releaseDate = item.release_date || item.first_air_date;
              const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
              const isTv = item.media_type === 'tv';

              return (
                <div key={item.id} className="flex flex-col group relative">
                  {/* Poster Wrapper */}
                  <div 
                    onClick={() => handleOpenPreview(item)}
                    className="relative rounded-2xl overflow-hidden aspect-[2/3] border border-black/5 dark:border-white/10 shadow-md hover:border-black/20 dark:hover:border-white/20 transition-all duration-300 cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    {posterUrl ? (
                      <img 
                        src={posterUrl} 
                        alt={title} 
                        className="absolute inset-0 w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-2xl mb-1">🎬</span>
                        <span className="text-xs font-medium opacity-50" style={{ color: 'var(--text-tertiary)' }}>Afiş Yok</span>
                      </div>
                    )}

                    {/* Score badge */}
                    {item.vote_average > 0 && (
                      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-bold text-amber-400">
                        <span>★</span>
                        <span className="text-white font-mono">{item.vote_average.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Media type pill */}
                    <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white/90">
                      {isTv ? 'Dizi' : 'Film'}
                    </div>

                    {/* Quick Add Button on Hover/Tap */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col justify-end z-20 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {inWatchlist ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const existingId = getExistingItemId(item.id);
                            if (existingId && onOpenItemModal) onOpenItemModal(existingId);
                          }}
                          className="w-full py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 backdrop-blur-md haptic-tap"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          <span>Listende</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={addingId === item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToList(item);
                          }}
                          className="w-full py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 bg-accent text-white active:scale-95 shadow-md haptic-tap transition-all disabled:opacity-50"
                        >
                          {addingId === item.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                              <span>Listeme Ekle</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Info below poster */}
                  <div className="mt-2 flex flex-col px-0.5">
                    <h3 
                      onClick={() => handleOpenPreview(item)}
                      className="text-sm font-bold tracking-tight truncate group-hover:text-accent transition-colors cursor-pointer" 
                      style={{ color: 'var(--text-primary)' }} 
                      title={title}
                    >
                      {title}
                    </h3>
                    <span className="text-[11px] font-medium opacity-65 truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {year || '—'} • {isTv ? 'Dizi' : 'Film'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setPreviewItem(null)}
        >
          <div 
            className="relative w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            style={{ background: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Backdrop */}
            <div className="relative w-full h-56 bg-black">
              {previewItem.backdrop_path ? (
                <img 
                  src={getTMDBBackdropUrl(previewItem.backdrop_path)!} 
                  alt={previewItem.title || previewItem.name} 
                  className="w-full h-full object-cover"
                />
              ) : previewItem.poster_path ? (
                <img 
                  src={getTMDBImageUrl(previewItem.poster_path)!} 
                  alt={previewItem.title || previewItem.name} 
                  className="w-full h-full object-cover blur-xl opacity-50"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              <button 
                onClick={() => setPreviewItem(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition-colors haptic-tap"
              >
                ✕
              </button>

              <div className="absolute bottom-4 left-5 right-5 text-white">
                <div className="flex items-center gap-2 text-xs font-bold mb-1">
                  <span className="px-2 py-0.5 rounded bg-white/20 uppercase tracking-wider">
                    {previewItem.media_type === 'tv' ? 'Dizi' : 'Film'}
                  </span>
                  <span>{previewItem.release_date || previewItem.first_air_date ? new Date(previewItem.release_date || previewItem.first_air_date!).getFullYear() : ''}</span>
                  {previewItem.vote_average > 0 && (
                    <span className="text-amber-400 font-bold">★ {previewItem.vote_average.toFixed(1)}</span>
                  )}
                </div>
                <h2 className="text-2xl font-black">{previewItem.title || previewItem.name}</h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {previewItem.genres && previewItem.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {previewItem.genres.map(g => (
                    <span key={g.id} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 border border-white/10" style={{ color: 'var(--text-secondary)' }}>
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {previewItem.overview && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {previewItem.overview}
                </p>
              )}

              {/* Action */}
              <div className="pt-2 flex items-center gap-3">
                {isItemInWatchlist(previewItem.id) ? (
                  <div className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    ✓ Zaten Kütüphanende Kayıtlı
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={addingId === previewItem.id}
                    onClick={async () => {
                      await handleAddToList(previewItem);
                      setPreviewItem(null);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 bg-accent text-white active:scale-95 transition-all shadow-lg haptic-tap disabled:opacity-50"
                  >
                    {addingId === previewItem.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span>Listeme Ekle (Planlandı)</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="px-5 py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
