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
import { WATCH_TYPE_INFO, WatchStatus } from '@/types';
import { WatchStatusIcon } from './WatchIcons';
import { useWatchlist } from '@/hooks/useWatchlist';
import { showToast } from '@/components/ui/Toast';
import HeroBillboard from './HeroBillboard';
import { motion, AnimatePresence } from 'framer-motion';

type DiscoverCategory = 'trending' | 'popular_movies' | 'popular_series' | 'top_rated';

interface DiscoverCardProps {
  item: TMDBResult;
  inWatchlist: boolean;
  isAdding: boolean;
  onAdd: (item: TMDBResult) => void;
  onOpenPreview: (item: TMDBResult) => void;
}

function DiscoverCard({
  item,
  inWatchlist,
  isAdding,
  onAdd,
  onOpenPreview,
}: DiscoverCardProps) {
  const isTv = item.media_type === 'tv';
  const typeInfo = WATCH_TYPE_INFO[isTv ? 'series' : 'movie'];
  const title = (item.title || item.name || 'İsimsiz').trim();
  const releaseDate = item.release_date || item.first_air_date;
  const displayYear = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const posterUrl = getTMDBImageUrl(item.poster_path);
  const rating = item.vote_average ? Number(item.vote_average.toFixed(1)) : 0;

  let infoText = displayYear ? `${displayYear}` : '—';
  infoText += ` • ${typeInfo.label}`;
  if (rating > 0) {
    infoText += ` • ★ ${rating}`;
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="flex flex-col w-full h-full group relative shrink-0"
    >
      <div 
        onClick={() => onOpenPreview(item)}
        className="block relative rounded-2xl overflow-hidden aspect-[2/3] border border-black/5 dark:border-white/10 shadow-md hover:border-black/20 dark:hover:border-white/20 transition-all duration-300 cursor-pointer"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        {/* Poster Image */}
        {posterUrl ? (
          <img 
            src={posterUrl} 
            alt={title} 
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <WatchStatusIcon icon={typeInfo.icon} className="w-10 h-10 mb-2 opacity-30" />
            <span className="text-xs font-medium opacity-50" style={{ color: 'var(--text-tertiary)' }}>Afiş Yok</span>
          </div>
        )}
        
        {/* Rating Pill Overlay (Exact match to WatchCard) */}
        {rating > 0 ? (
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-bold text-amber-400 shadow-sm pointer-events-none">
            <span>★</span>
            <span className="text-white font-mono">{rating}</span>
          </div>
        ) : null}

        {/* Top Gradient for button visibility (Exact match to WatchCard) */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Top right Action Button (Matches WatchCard 3-dot position & style) */}
      {inWatchlist ? (
        <div 
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-emerald-400 backdrop-blur-md pointer-events-auto z-20"
          title="Listende Kayıtlı"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      ) : (
        <button 
          type="button"
          disabled={isAdding}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAdd(item);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70 backdrop-blur-md pointer-events-auto z-20 cursor-pointer haptic-tap disabled:opacity-50"
          title="Listeme Ekle"
        >
          {isAdding ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          )}
        </button>
      )}

      {/* Info Below Poster (Exact match to WatchCard) */}
      <div className="mt-2 flex flex-col px-0.5">
        <h3 
          onClick={() => onOpenPreview(item)}
          className="text-sm font-bold tracking-tight truncate group-hover:text-accent transition-colors cursor-pointer" 
          style={{ color: 'var(--text-primary)' }} 
          title={title}
        >
          {title}
        </h3>
        <span className="text-[11px] font-medium opacity-65 truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {infoText}
        </span>
      </div>
    </motion.div>
  );
}

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

  const isItemInWatchlist = (tmdbId: number) => {
    return items.some(item => item.tmdbId === tmdbId);
  };

  const getExistingItemId = (tmdbId: number) => {
    return items.find(item => item.tmdbId === tmdbId)?.id;
  };

  const handleAddToList = async (tmdb: TMDBResult) => {
    if (addingId === tmdb.id) return;
    setAddingId(tmdb.id);

    try {
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

      await addItem({
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

      showToast(`"${title}" listene eklendi`);
    } catch (err) {
      console.error('Add to watchlist error:', err);
      showToast('Eklenirken bir hata oluştu', 'error');
    } finally {
      setAddingId(null);
    }
  };

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
      {/* Category Filter Chips Bar (Clean SVG icons, standard Snapbook pill design) */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5">
        <button
          onClick={() => setActiveCategory('trending')}
          className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all haptic-tap cursor-pointer border ${
            activeCategory === 'trending'
              ? 'border-transparent shadow-sm'
              : 'border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          style={{
            background: activeCategory === 'trending' ? 'var(--accent)' : 'var(--bg-secondary)',
            color: activeCategory === 'trending' ? 'white' : 'var(--text-secondary)'
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
          </svg>
          <span>Haftanın Trendleri</span>
        </button>

        <button
          onClick={() => setActiveCategory('popular_movies')}
          className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all haptic-tap cursor-pointer border ${
            activeCategory === 'popular_movies'
              ? 'border-transparent shadow-sm'
              : 'border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          style={{
            background: activeCategory === 'popular_movies' ? 'var(--accent)' : 'var(--bg-secondary)',
            color: activeCategory === 'popular_movies' ? 'white' : 'var(--text-secondary)'
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.744h-.753v8.25h7.498v-8.25h-.753m-7.497 0a.5.5 0 01.5-.5h8.497a.5.5 0 01.5.5v8.25h-9.497v-8.25zM6.75 12h10.5m-10.5 0v7.5h10.5V12m-10.5 0H3.75m13.5 0h2.25M3.75 12V5.25m0 6.75h2.25M20.25 5.25v6.75m0-6.75H17.25M3.75 5.25H6M20.25 5.25h-2.25" />
          </svg>
          <span>Popüler Filmler</span>
        </button>

        <button
          onClick={() => setActiveCategory('popular_series')}
          className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all haptic-tap cursor-pointer border ${
            activeCategory === 'popular_series'
              ? 'border-transparent shadow-sm'
              : 'border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          style={{
            background: activeCategory === 'popular_series' ? 'var(--accent)' : 'var(--bg-secondary)',
            color: activeCategory === 'popular_series' ? 'white' : 'var(--text-secondary)'
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <span>Popüler Diziler</span>
        </button>

        <button
          onClick={() => setActiveCategory('top_rated')}
          className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all haptic-tap cursor-pointer border ${
            activeCategory === 'top_rated'
              ? 'border-transparent shadow-sm'
              : 'border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          style={{
            background: activeCategory === 'top_rated' ? 'var(--accent)' : 'var(--bg-secondary)',
            color: activeCategory === 'top_rated' ? 'white' : 'var(--text-secondary)'
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <span>En İyiler</span>
        </button>
      </div>

      {/* Hero Billboard for featured trending item */}
      {!loading && heroItem && (
        <HeroBillboard
          tmdbItem={heroItem}
          isAdded={isItemInWatchlist(heroItem.id)}
          isAdding={addingId === heroItem.id}
          onAddToList={handleAddToList}
          onNext={() => setHeroIndex(idx => (idx + 1) % results.length)}
        />
      )}

      {/* Items Grid (Exact layout and density as Listelerim) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold tracking-widest uppercase flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
            <span>{
              activeCategory === 'trending' ? 'Haftanın Trendleri' :
              activeCategory === 'popular_movies' ? 'Popüler Filmler' :
              activeCategory === 'popular_series' ? 'Popüler Diziler' : 'En İyiler'
            }</span>
            <span className="text-xs font-normal opacity-50">({results.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 sm:gap-4 lg:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(i => (
              <div key={i} className="aspect-[2/3] rounded-2xl skeleton" />
            ))}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 sm:gap-4 lg:gap-5">
            <AnimatePresence>
              {results.map(item => (
                <DiscoverCard
                  key={item.id}
                  item={item}
                  inWatchlist={isItemInWatchlist(item.id)}
                  isAdding={addingId === item.id}
                  onAdd={handleAddToList}
                  onOpenPreview={handleOpenPreview}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Preview Modal (Styled identically to WatchItemModal) */}
      {previewItem && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-[fadeIn_0.2s_ease-out] overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setPreviewItem(null)}
        >
          <div 
            className="relative w-full sm:max-w-[700px] text-white overflow-y-auto hide-scrollbar rounded-t-[32px] sm:rounded-3xl shadow-2xl animate-[slideUp_0.35s_cubic-bezier(0.34,1.56,0.64,1)] h-[85vh] sm:h-auto sm:max-h-[85vh]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Backdrop */}
            <div className="relative w-full h-[50vw] sm:h-[260px] bg-black/60 shrink-0">
              {previewItem.backdrop_path ? (
                <img 
                  src={getTMDBBackdropUrl(previewItem.backdrop_path)!} 
                  alt={previewItem.title || previewItem.name} 
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: 'center 10%', filter: 'brightness(0.85)' }}
                />
              ) : previewItem.poster_path ? (
                <img 
                  src={getTMDBImageUrl(previewItem.poster_path)!} 
                  alt={previewItem.title || previewItem.name} 
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40"
                />
              ) : null}

              <div 
                className="absolute inset-0" 
                style={{
                  background: 'linear-gradient(to top, var(--bg-card) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)'
                }} 
              />
              
              <button 
                onClick={() => setPreviewItem(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/70 haptic-tap cursor-pointer z-20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content overlapping backdrop */}
            <div className="px-5 sm:px-8 -mt-20 sm:-mt-24 relative z-10 pb-8">
              <div className="flex gap-4 sm:gap-5 items-end mb-5">
                {/* Poster */}
                <div className="w-24 sm:w-28 shrink-0 rounded-xl overflow-hidden aspect-[2/3] bg-black/20 shadow-xl border-2 border-white/10 relative z-20">
                  {previewItem.poster_path ? (
                    <img
                      src={getTMDBImageUrl(previewItem.poster_path)!}
                      alt={previewItem.title || previewItem.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <WatchStatusIcon icon={previewItem.media_type === 'tv' ? 'tv' : 'film'} className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                </div>

                {/* Title & Metadata */}
                <div className="flex flex-col pb-1 z-20">
                  <h1 className="text-xl sm:text-3xl font-bold tracking-tight mb-1.5 leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {previewItem.title || previewItem.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    <span className="px-1.5 py-0.5 rounded uppercase text-[10px]" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {previewItem.media_type === 'tv' ? 'Dizi' : 'Film'}
                    </span>
                    <span>
                      {previewItem.release_date || previewItem.first_air_date ? new Date((previewItem.release_date || previewItem.first_air_date)!).getFullYear() : ''}
                    </span>
                    {previewItem.vote_average > 0 && (
                      <span className="flex items-center gap-1 text-[#f5c518]">
                        ★ {previewItem.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="mb-5">
                {isItemInWatchlist(previewItem.id) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const id = getExistingItemId(previewItem.id);
                      setPreviewItem(null);
                      if (id && onOpenItemModal) onOpenItemModal(id);
                    }}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 haptic-tap"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Listende Kayıtlı (Görüntüle)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={addingId === previewItem.id}
                    onClick={async () => {
                      await handleAddToList(previewItem);
                      setPreviewItem(null);
                    }}
                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm haptic-tap transition-all disabled:opacity-50"
                    style={{ background: 'var(--accent)', color: 'white' }}
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
              </div>

              {/* Details & Overview */}
              <div className="space-y-4">
                {previewItem.genres && previewItem.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {previewItem.genres.map(g => (
                      <span key={g.id} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}

                {previewItem.overview && (
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Konu / Özet</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {previewItem.overview}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
