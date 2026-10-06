'use client';

import { useState, useEffect, useRef } from 'react';
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
import { WATCH_TYPE_INFO, WatchStatus, WATCH_STATUS_INFO } from '@/types';
import { WatchStatusIcon } from './WatchIcons';
import { useWatchlist } from '@/hooks/useWatchlist';
import { showToast } from '@/components/ui/Toast';
import HeroBillboard from './HeroBillboard';
import { motion, AnimatePresence } from 'framer-motion';

type DiscoverCategory = 'all' | 'trending' | 'popular_movies' | 'popular_series' | 'top_rated';

interface DiscoverCardProps {
  item: TMDBResult;
  inWatchlist: boolean;
  onOpenCard: (item: TMDBResult) => void;
}

function DiscoverCard({
  item,
  inWatchlist,
  onOpenCard,
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
    <div className="flex flex-col w-full h-full group relative shrink-0">
      <div 
        onClick={() => onOpenCard(item)}
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

        {/* Top Gradient for button visibility */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Top right Action Button - Centered icon */}
      {inWatchlist ? (
        <div 
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-emerald-400 backdrop-blur-md pointer-events-auto z-20 border border-emerald-500/30"
          title="Listende Kayıtlı"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      ) : (
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenCard(item);
          }}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70 backdrop-blur-md pointer-events-auto z-20 cursor-pointer haptic-tap"
          title="Listeme Ekle"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}

      {/* Info Below Poster (Exact match to WatchCard) */}
      <div className="mt-2 flex flex-col px-0.5">
        <h3 
          onClick={() => onOpenCard(item)}
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
    </div>
  );
}

function DiscoverSlider({
  items,
  cardWidthClass,
  isItemInWatchlist,
  onOpenCard,
}: {
  items: TMDBResult[];
  cardWidthClass: string;
  isItemInWatchlist: (id: number) => boolean;
  onOpenCard: (item: TMDBResult) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -(scrollRef.current.clientWidth * 0.8), behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: scrollRef.current.clientWidth * 0.8, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group/slider">
      {/* Left Scroll Button */}
      {canScrollLeft && (
        <button 
          type="button"
          onClick={handleScrollLeft}
          className="absolute left-0 top-0 bottom-4 z-30 w-12 lg:w-16 flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
          style={{ background: 'linear-gradient(to right, var(--bg-primary) 10%, transparent)' }}
          aria-label="Sola kaydır"
        >
          <div className="w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg active:scale-90 transition-transform duration-200" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </div>
        </button>
      )}

      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex overflow-x-auto hide-scrollbar gap-3 lg:gap-4 px-4 lg:px-6 pb-4 relative z-0"
      >
        {items.map(item => (
          <div key={item.id} className={`shrink-0 ${cardWidthClass}`}>
            <DiscoverCard 
              item={item} 
              inWatchlist={isItemInWatchlist(item.id)} 
              onOpenCard={onOpenCard} 
            />
          </div>
        ))}
      </div>

      {/* Right Scroll Button */}
      {canScrollRight && items.length > 0 && (
        <button 
          type="button"
          onClick={handleScrollRight}
          className="absolute right-0 top-0 bottom-4 z-30 w-12 lg:w-16 flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
          style={{ background: 'linear-gradient(to left, var(--bg-primary) 10%, transparent)' }}
          aria-label="Sağa kaydır"
        >
          <div className="w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg active:scale-90 transition-transform duration-200" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </button>
      )}
    </div>
  );
}

export default function DiscoverView({ 
  cardWidthClass = 'w-40 sm:w-48 md:w-56 lg:w-64',
  onOpenItemModal 
}: { 
  cardWidthClass?: string;
  onOpenItemModal?: (id: string) => void;
}) {
  const { items, customLists, addItem } = useWatchlist();
  const [activeCategory, setActiveCategory] = useState<DiscoverCategory>('all');
  
  // Data for all categories
  const [trending, setTrending] = useState<TMDBResult[]>([]);
  const [popularMovies, setPopularMovies] = useState<TMDBResult[]>([]);
  const [popularSeries, setPopularSeries] = useState<TMDBResult[]>([]);
  const [topRated, setTopRated] = useState<TMDBResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected item for modal
  const [previewItem, setPreviewItem] = useState<TMDBDetails | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  // Form selections in Modal
  const [selectedStatus, setSelectedStatus] = useState<WatchStatus>('planned');
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const statusRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCancelled = false;
    async function loadAll() {
      setLoading(true);
      try {
        const [tr, pm, ps, trt] = await Promise.all([
          getTrendingTMDB(1),
          getPopularMoviesTMDB(1),
          getPopularSeriesTMDB(1),
          getTopRatedTMDB(1),
        ]);
        if (!isCancelled) {
          setTrending(tr);
          setPopularMovies(pm);
          setPopularSeries(ps);
          setTopRated(trt);
          setLoading(false);
        }
      } catch (err) {
        console.error('Discover load error:', err);
        if (!isCancelled) setLoading(false);
      }
    }
    loadAll();
    return () => { isCancelled = true; };
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setShowListMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isItemInWatchlist = (tmdbId: number) => {
    return items.some(item => item.tmdbId === tmdbId);
  };

  const getExistingItemId = (tmdbId: number) => {
    return items.find(item => item.tmdbId === tmdbId)?.id;
  };

  const handleOpenCard = async (tmdb: TMDBResult) => {
    setLoadingPreview(true);
    setSelectedStatus('planned');
    setSelectedListIds([]);
    setShowStatusMenu(false);
    setShowListMenu(false);
    setShowTrailer(false);

    const details = await getTMDBDetails(tmdb.id, tmdb.media_type);
    if (details) {
      setPreviewItem(details);
    }
    setLoadingPreview(false);
  };

  const handleConfirmAdd = async () => {
    if (!previewItem || addingId === previewItem.id) return;
    setAddingId(previewItem.id);

    try {
      const title = (previewItem.title || previewItem.name || 'İsimsiz').trim();
      
      let trailerUrl: string | undefined = undefined;
      if (previewItem.videos?.results) {
        const trTrailers = previewItem.videos.results.filter(v => v.site === 'YouTube' && v.type === 'Trailer' && v.iso_639_1 === 'tr');
        const enTrailers = previewItem.videos.results.filter(v => v.site === 'YouTube' && v.type === 'Trailer');
        const anyVideo = previewItem.videos.results.filter(v => v.site === 'YouTube');
        const video = trTrailers[0] || enTrailers[0] || anyVideo[0];
        if (video) trailerUrl = `https://www.youtube.com/watch?v=${video.key}`;
      }

      const releaseDate = previewItem.release_date || previewItem.first_air_date;
      const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : undefined;

      await addItem({
        title,
        type: previewItem.media_type === 'tv' ? 'series' : 'movie',
        status: selectedStatus,
        rating: previewItem.vote_average ? Number(previewItem.vote_average.toFixed(1)) : undefined,
        releaseYear,
        duration: previewItem.runtime || previewItem.episode_run_time?.[0] || undefined,
        description: previewItem.overview?.trim() || undefined,
        tags: [],
        listIds: selectedListIds,
        totalSeasons: previewItem.number_of_seasons || undefined,
        totalEpisodes: previewItem.number_of_episodes || undefined,
        posterUrl: getTMDBImageUrl(previewItem.poster_path) || undefined,
        backdropUrl: getTMDBBackdropUrl(previewItem.backdrop_path) || undefined,
        tmdbId: previewItem.id,
        trailerUrl,
      });

      showToast(`"${title}" listene eklendi!`);
      setPreviewItem(null);
    } catch (err) {
      console.error('Add to watchlist error:', err);
      showToast('Eklenirken bir hata oluştu', 'error');
    } finally {
      setAddingId(null);
    }
  };

  const extractYouTubeId = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const eligibleHeroTrending = trending.filter(t => !!t.backdrop_path);
  const heroTrendingPool = eligibleHeroTrending.length > 0 ? eligibleHeroTrending : trending;
  const heroItem = heroTrendingPool.length > 0 ? heroTrendingPool[heroIndex % heroTrendingPool.length] : null;

  // Trailer for previewItem
  const previewTrailerKey = (() => {
    if (!previewItem?.videos?.results) return null;
    const trTrailers = previewItem.videos.results.filter(v => v.site === 'YouTube' && v.type === 'Trailer' && v.iso_639_1 === 'tr');
    const enTrailers = previewItem.videos.results.filter(v => v.site === 'YouTube' && v.type === 'Trailer');
    const anyVideo = previewItem.videos.results.filter(v => v.site === 'YouTube');
    const video = trTrailers[0] || enTrailers[0] || anyVideo[0];
    return video ? video.key : null;
  })();

  const durationText = (() => {
    if (!previewItem) return null;
    const dur = previewItem.runtime || previewItem.episode_run_time?.[0];
    if (!dur) return null;
    const h = Math.floor(dur / 60);
    const m = dur % 60;
    return h > 0 ? `${h}s ${m > 0 ? `${m}dk` : ''}` : `${m}dk`;
  })();

  return (
    <div className="space-y-6">
      {/* Category Filter Chips Bar (Clean SVG icons) */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-4 lg:px-6 py-0.5">
        <button
          onClick={() => setActiveCategory('all')}
          className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all haptic-tap cursor-pointer border ${
            activeCategory === 'all'
              ? 'border-transparent shadow-sm'
              : 'border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          style={{
            background: activeCategory === 'all' ? 'var(--accent)' : 'var(--bg-secondary)',
            color: activeCategory === 'all' ? 'white' : 'var(--text-secondary)'
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />
          </svg>
          <span>Tümü</span>
        </button>

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
          <span>Trendler</span>
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
          <span>Filmler</span>
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
          <span>Diziler</span>
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
        <div className="px-4 lg:px-6">
          <HeroBillboard
            tmdbItem={heroItem}
            isAdded={isItemInWatchlist(heroItem.id)}
            onAddToList={handleOpenCard}
            onNext={() => setHeroIndex(idx => (idx + 1) % heroTrendingPool.length)}
          />
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="px-4 lg:px-6 flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`${cardWidthClass} shrink-0 aspect-[2/3] rounded-2xl skeleton`} />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Haftanın Trendleri */}
          {(activeCategory === 'all' || activeCategory === 'trending') && trending.length > 0 && (
            <div className="relative group/list">
              <div className="flex items-center px-4 lg:px-6 mb-3 gap-2">
                <h2 className="text-sm font-bold tracking-widest uppercase flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                  Haftanın Trendleri
                </h2>
                <span className="text-[10px] opacity-50 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  {trending.length}
                </span>
              </div>
              <DiscoverSlider
                items={trending}
                cardWidthClass={cardWidthClass}
                isItemInWatchlist={isItemInWatchlist}
                onOpenCard={handleOpenCard}
              />
            </div>
          )}

          {/* Section 2: Popüler Filmler */}
          {(activeCategory === 'all' || activeCategory === 'popular_movies') && popularMovies.length > 0 && (
            <div className="relative group/list">
              <div className="flex items-center px-4 lg:px-6 mb-3 gap-2">
                <h2 className="text-sm font-bold tracking-widest uppercase flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                  Popüler Filmler
                </h2>
                <span className="text-[10px] opacity-50 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  {popularMovies.length}
                </span>
              </div>
              <DiscoverSlider
                items={popularMovies}
                cardWidthClass={cardWidthClass}
                isItemInWatchlist={isItemInWatchlist}
                onOpenCard={handleOpenCard}
              />
            </div>
          )}

          {/* Section 3: Popüler Diziler */}
          {(activeCategory === 'all' || activeCategory === 'popular_series') && popularSeries.length > 0 && (
            <div className="relative group/list">
              <div className="flex items-center px-4 lg:px-6 mb-3 gap-2">
                <h2 className="text-sm font-bold tracking-widest uppercase flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                  Popüler Diziler
                </h2>
                <span className="text-[10px] opacity-50 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  {popularSeries.length}
                </span>
              </div>
              <DiscoverSlider
                items={popularSeries}
                cardWidthClass={cardWidthClass}
                isItemInWatchlist={isItemInWatchlist}
                onOpenCard={handleOpenCard}
              />
            </div>
          )}

          {/* Section 4: En İyiler */}
          {(activeCategory === 'all' || activeCategory === 'top_rated') && topRated.length > 0 && (
            <div className="relative group/list">
              <div className="flex items-center px-4 lg:px-6 mb-3 gap-2">
                <h2 className="text-sm font-bold tracking-widest uppercase flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                  En İyiler
                </h2>
                <span className="text-[10px] opacity-50 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  {topRated.length}
                </span>
              </div>
              <DiscoverSlider
                items={topRated}
                cardWidthClass={cardWidthClass}
                isItemInWatchlist={isItemInWatchlist}
                onOpenCard={handleOpenCard}
              />
            </div>
          )}
        </div>
      )}

      {/* Detail Modal (Exact layout & size as WatchItemModal) */}
      {previewItem && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-[fadeIn_0.2s_ease-out] overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setPreviewItem(null)}
        >
          <div 
            className="relative w-full sm:max-w-[700px] text-white overflow-y-auto hide-scrollbar rounded-t-[32px] sm:rounded-3xl shadow-2xl animate-[slideUp_0.35s_cubic-bezier(0.34,1.56,0.64,1)] h-[90vh]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HERO BACKDROP (Netflix Style) */}
            <div className="relative w-full h-[55vw] sm:h-[350px] bg-black/50 shrink-0">
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
                  className="absolute inset-0 w-full h-full object-cover blur-3xl scale-125 opacity-40"
                />
              ) : null}

              {/* Gradient overlay */}
              <div 
                className="absolute inset-0" 
                style={{
                  background: 'linear-gradient(to top, var(--bg-card) 0%, rgba(0,0,0,0) 100%)'
                }} 
              />
              
              {/* Close Button */}
              <button 
                onClick={() => setPreviewItem(null)}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/70 haptic-tap cursor-pointer z-20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* CONTENT OVERLAPPING HERO */}
            <div className="px-5 sm:px-8 -mt-24 sm:-mt-32 relative z-10 pb-10">
              
              {/* Poster & Title Row */}
              <div className="flex gap-5 sm:gap-6 items-end mb-6">
                {/* Overlapping Vertical Poster */}
                <div className="w-28 sm:w-36 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden aspect-[2/3] bg-black/20 shadow-2xl border-2 border-white/10 relative z-20">
                  {previewItem.poster_path ? (
                    <img
                      src={getTMDBImageUrl(previewItem.poster_path)!}
                      alt={previewItem.title || previewItem.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-white/5">
                      <WatchStatusIcon icon={previewItem.media_type === 'tv' ? 'tv' : 'film'} className="w-10 h-10 opacity-20" />
                    </div>
                  )}
                </div>

                {/* Title & Metadata */}
                <div className="flex flex-col pb-2 z-20">
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2 leading-tight drop-shadow-md" style={{ color: 'var(--text-primary)' }}>
                    {previewItem.title || previewItem.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[11px] sm:text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                    <span className="px-1.5 py-0.5 rounded uppercase" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {previewItem.media_type === 'tv' ? 'Dizi' : 'Film'}
                    </span>
                    <span className="opacity-80">
                      {previewItem.release_date || previewItem.first_air_date ? new Date((previewItem.release_date || previewItem.first_air_date)!).getFullYear() : ''}
                    </span>
                    {previewItem.genres && previewItem.genres.length > 0 && (
                      <>
                        <span className="w-1 h-1 rounded-full opacity-50 bg-current" />
                        <span className="opacity-80">{previewItem.genres[0].name}</span>
                      </>
                    )}
                    {previewItem.vote_average > 0 && (
                      <>
                        <span className="w-1 h-1 rounded-full opacity-50 bg-current" />
                        <span className="flex items-center gap-1 text-[#f5c518]">
                          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {previewItem.vote_average.toFixed(1)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and List Pickers */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5 mb-4">
                {/* Status Dropdown */}
                <div ref={statusRef} className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setShowStatusMenu(v => !v)}
                    className="w-full py-3 px-4 flex items-center justify-between rounded-2xl transition-all haptic-tap cursor-pointer font-bold text-sm shadow-sm"
                    style={{ 
                      background: `${WATCH_STATUS_INFO[selectedStatus].color}15`, 
                      color: WATCH_STATUS_INFO[selectedStatus].color,
                      border: `1px solid ${WATCH_STATUS_INFO[selectedStatus].color}30`
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <WatchStatusIcon icon={WATCH_STATUS_INFO[selectedStatus].icon} className="w-5 h-5 shrink-0" />
                      <span>{WATCH_STATUS_INFO[selectedStatus].label}</span>
                    </div>
                    <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {showStatusMenu && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-full p-2 rounded-2xl shadow-xl z-50 animate-[slideDown_0.15s_ease-out]"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                    >
                      {(Object.entries(WATCH_STATUS_INFO) as [WatchStatus, typeof WATCH_STATUS_INFO[WatchStatus]][]).map(([key, info]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSelectedStatus(key);
                            setShowStatusMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors text-left"
                          style={{ 
                            color: selectedStatus === key ? info.color : 'var(--text-primary)', 
                            background: selectedStatus === key ? `${info.color}15` : 'transparent' 
                          }}
                        >
                          <WatchStatusIcon icon={info.icon} className="w-5 h-5 shrink-0" />
                          <span className="font-medium">{info.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* List Selector Dropdown */}
                <div ref={listRef} className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setShowListMenu(v => !v)}
                    className="w-full py-3 px-4 flex items-center justify-between rounded-2xl transition-all haptic-tap cursor-pointer font-medium text-sm shadow-sm"
                    style={{ 
                      background: 'var(--bg-secondary)', 
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-primary)'
                    }}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <svg className="w-4 h-4 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                      </svg>
                      <span className="truncate">
                        {selectedListIds.length === 0 
                          ? 'Listesiz (Genel)' 
                          : customLists.filter(l => selectedListIds.includes(l.id)).map(l => l.name).join(', ') || 'Listesiz'}
                      </span>
                    </div>
                    <svg className="w-4 h-4 opacity-60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {showListMenu && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-full max-h-56 overflow-y-auto hide-scrollbar p-2 rounded-2xl shadow-xl z-50 animate-[slideDown_0.15s_ease-out]"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedListIds([])}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <span>Listesiz (Genel)</span>
                        {selectedListIds.length === 0 && (
                          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                      {customLists.map(list => {
                        const isSelected = selectedListIds.includes(list.id);
                        return (
                          <button
                            key={list.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedListIds(ids => ids.filter(id => id !== list.id));
                              } else {
                                setSelectedListIds(ids => [...ids, list.id]);
                              }
                            }}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <span className="truncate pr-2">{list.name}</span>
                            {isSelected && (
                              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Trailer Button */}
                {previewTrailerKey && (
                  <button
                    type="button"
                    onClick={() => setShowTrailer(true)}
                    className="w-14 h-12 sm:w-14 sm:h-auto shrink-0 flex items-center justify-center rounded-2xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm active:scale-95 cursor-pointer haptic-tap"
                    title="Fragman İzle"
                  >
                    <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Action Button Row */}
              <div className="mb-6">
                {isItemInWatchlist(previewItem.id) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const existingId = getExistingItemId(previewItem.id);
                      setPreviewItem(null);
                      if (existingId && onOpenItemModal) onOpenItemModal(existingId);
                    }}
                    className="w-full py-3.5 px-4 flex items-center justify-center gap-2 rounded-2xl font-bold text-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 haptic-tap cursor-pointer"
                  >
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Listende Kayıtlı (Detayları Gör)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={addingId === previewItem.id}
                    onClick={handleConfirmAdd}
                    className="w-full py-3.5 px-4 flex items-center justify-center gap-2 rounded-2xl font-bold text-sm shadow-md transition-all haptic-tap cursor-pointer active:scale-95 disabled:opacity-50"
                    style={{ background: 'var(--accent)', color: 'white' }}
                  >
                    {addingId === previewItem.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span className="leading-none">Listeme Ekle</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Unified Stats Grid (Exact match to WatchItemModal) */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  {/* Total Seasons (Series Only) */}
                  {previewItem.media_type === 'tv' && previewItem.number_of_seasons && (
                    <div className="p-3.5 rounded-2xl flex flex-col justify-center" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>TOPLAM SEZON</div>
                      <div className="text-xl font-black text-accent">{previewItem.number_of_seasons}</div>
                    </div>
                  )}

                  {/* Total Episodes (Series Only) */}
                  {previewItem.media_type === 'tv' && previewItem.number_of_episodes && (
                    <div className="p-3.5 rounded-2xl flex flex-col justify-center" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>TOPLAM BÖLÜM</div>
                      <div className="text-xl font-black text-accent">{previewItem.number_of_episodes}</div>
                    </div>
                  )}

                  {/* Duration */}
                  {durationText && (
                    <div className="p-3.5 rounded-2xl flex flex-col justify-center" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>SÜRE</div>
                      <div className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                        {durationText}
                      </div>
                    </div>
                  )}

                  {/* Rating */}
                  {previewItem.vote_average > 0 && (
                    <div className="p-3.5 rounded-2xl flex flex-col justify-center" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>IMDB / PUAN</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-[#f5c518]">{previewItem.vote_average.toFixed(1)}</span>
                        <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>/ 10</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {previewItem.overview && (
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>KONU / ÖZET</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {previewItem.overview}
                    </p>
                  </div>
                )}

                {/* Genres */}
                {previewItem.genres && previewItem.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {previewItem.genres.map(g => (
                      <span key={g.id} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Cinematic Trailer Overlay */}
            {showTrailer && previewTrailerKey && (
              <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-[fadeIn_0.2s_ease-out]">
                <div className="w-full max-w-4xl px-4 sm:px-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold text-lg sm:text-xl line-clamp-1">{previewItem.title || previewItem.name} - Fragman</h3>
                    <button 
                      onClick={() => setShowTrailer(false)}
                      className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors haptic-tap cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10">
                    <iframe 
                      src={`https://www.youtube.com/embed/${previewTrailerKey}?autoplay=1&rel=0`}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
