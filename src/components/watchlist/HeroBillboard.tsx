'use client';

import { WatchItem, WATCH_TYPE_INFO } from '@/types';
import { TMDBResult, getTMDBHeroBackdropUrl, getTMDBImageUrl } from '@/lib/tmdb';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroBillboardProps {
  // If showing a personal collection item
  item?: WatchItem | null;
  // If showing a TMDB discovery item
  tmdbItem?: TMDBResult | null;
  onOpenDetails?: (id: string) => void;
  onNext?: () => void;
  onAddToList?: (tmdb: TMDBResult) => void;
  isAdded?: boolean;
  isAdding?: boolean;
}

export default function HeroBillboard({
  item,
  tmdbItem,
  onOpenDetails,
  onNext,
  onAddToList,
  isAdded,
  isAdding,
}: HeroBillboardProps) {
  const current = item || tmdbItem;
  if (!current) return null;

  // Extract metadata
  const isUserItem = !!item;
  const title = isUserItem ? item.title : (tmdbItem?.title || tmdbItem?.name || 'İsimsiz');
  const type = isUserItem ? item.type : (tmdbItem?.media_type === 'tv' ? 'series' : 'movie');
  const typeInfo = WATCH_TYPE_INFO[type];
  
  const releaseYear = isUserItem 
    ? item.releaseYear 
    : (tmdbItem?.release_date || tmdbItem?.first_air_date ? new Date((tmdbItem.release_date || tmdbItem.first_air_date)!).getFullYear() : undefined);
    
  const rating = isUserItem 
    ? item.rating 
    : (tmdbItem?.vote_average ? Number(tmdbItem.vote_average.toFixed(1)) : undefined);

  const overview = isUserItem ? item.description : tmdbItem?.overview;

  const backdropSrc = isUserItem
    ? (item.backdropUrl || item.posterUrl)
    : (getTMDBHeroBackdropUrl(tmdbItem?.backdrop_path) || getTMDBImageUrl(tmdbItem?.poster_path));

  return (
    <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden mb-6 sm:mb-8 shadow-2xl border border-white/10 group select-none">
      {/* Background Container */}
      <div className="relative w-full h-[360px] sm:h-[420px] md:h-[480px] lg:h-[520px] bg-black/80">
        <AnimatePresence mode="wait">
          {backdropSrc ? (
            <motion.img
              key={backdropSrc}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              src={backdropSrc}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover object-center md:object-top"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-black" />
          )}
        </AnimatePresence>

        {/* Cinematic Vignette & Fade Overlays */}
        {/* 1. Left fade for text readability */}
        <div 
          className="absolute inset-0 hidden md:block" 
          style={{
            background: 'linear-gradient(to right, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.65) 40%, rgba(0, 0, 0, 0.1) 75%, transparent 100%)'
          }} 
        />
        {/* 2. Full background darken for mobile */}
        <div 
          className="absolute inset-0 md:hidden" 
          style={{
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.25) 100%)'
          }} 
        />
        {/* 3. Bottom blend into page background */}
        <div 
          className="absolute inset-x-0 bottom-0 h-40" 
          style={{
            background: 'linear-gradient(to top, var(--bg-primary) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)'
          }} 
        />

        {/* Content Info */}
        <div className="absolute inset-0 p-5 sm:p-8 md:p-12 flex flex-col justify-end z-10 max-w-2xl">
          {/* Top Tag Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md border border-white/20">
              {typeInfo.label}
            </span>

            {releaseYear && (
              <span className="text-xs font-semibold text-white/80">
                {releaseYear}
              </span>
            )}

            {rating !== undefined && rating > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                <span>★</span>
                <span>{rating}</span>
              </span>
            )}

            {isUserItem && item.genre && (
              <span className="text-xs font-medium text-white/70 hidden sm:inline">
                • {item.genre}
              </span>
            )}

            {isUserItem && item.duration && (
              <span className="text-xs font-medium text-white/70 hidden sm:inline">
                • {Math.floor(item.duration / 60) > 0 ? `${Math.floor(item.duration / 60)}s ` : ''}{item.duration % 60 > 0 ? `${item.duration % 60}dk` : ''}
              </span>
            )}

            {isUserItem && item.type === 'series' && item.totalSeasons && (
              <span className="text-xs font-medium text-white/70 hidden sm:inline">
                • {item.totalSeasons} Sezon
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg mb-2 sm:mb-3 line-clamp-2">
            {title}
          </h1>

          {/* Overview */}
          {overview && (
            <p className="text-xs sm:text-sm text-white/80 line-clamp-2 sm:line-clamp-3 font-normal leading-relaxed drop-shadow-md mb-4 sm:mb-6 max-w-xl">
              {overview}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {isUserItem ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenDetails?.(item.id)}
                  className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-extrabold text-sm flex items-center gap-2 bg-white text-black hover:bg-white/90 active:scale-95 transition-all shadow-lg haptic-tap cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                  </svg>
                  <span>Detayları İncele</span>
                </button>

                {onNext && (
                  <button
                    type="button"
                    onClick={onNext}
                    className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl font-bold text-sm flex items-center gap-2 bg-black/40 text-white hover:bg-black/60 active:scale-95 transition-all border border-white/20 backdrop-blur-md haptic-tap cursor-pointer"
                    title="Başka bir rastgele öneri göster"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span>Başka Öneri</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {isAdded ? (
                  <div className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-sm flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 backdrop-blur-md">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Listende Kayıtlı</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isAdding}
                    onClick={() => tmdbItem && onAddToList?.(tmdbItem)}
                    className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-black text-sm flex items-center gap-2 bg-accent text-white hover:opacity-90 active:scale-95 transition-all shadow-lg haptic-tap cursor-pointer disabled:opacity-50"
                  >
                    {isAdding ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    )}
                    <span>Listeme Ekle</span>
                  </button>
                )}

                {onNext && (
                  <button
                    type="button"
                    onClick={onNext}
                    className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl font-bold text-sm flex items-center gap-2 bg-black/40 text-white hover:bg-black/60 active:scale-95 transition-all border border-white/20 backdrop-blur-md haptic-tap cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span>Sonraki Trend</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
