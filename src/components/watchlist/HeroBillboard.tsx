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

  const rawBackdropSrc = isUserItem
    ? (item.backdropUrl || item.posterUrl)
    : (getTMDBHeroBackdropUrl(tmdbItem?.backdrop_path) || getTMDBImageUrl(tmdbItem?.poster_path));

  // Seamlessly upgrade w780 to w1280 for sharp rendering on wide desktop monitors
  const backdropSrc = rawBackdropSrc?.replace('/w780/', '/w1280/') || rawBackdropSrc;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-6 sm:mb-8 border border-black/10 dark:border-white/10 shadow-lg group select-none">
      {/* Background Container - Mobile height 260px (preserved), Desktop enhanced to 380-420px */}
      <div className="relative w-full h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px] bg-black">
        <AnimatePresence mode="wait">
          {backdropSrc ? (
            <motion.img
              key={backdropSrc}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              src={backdropSrc}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-black" />
          )}
        </AnimatePresence>

        {/* Cinematic Vignette & Fade Overlays */}
        {/* Full-width bottom-to-top gradient: preserves full horizontal image view and protects typography */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.6) 45%, rgba(0, 0, 0, 0.1) 75%, transparent 100%)'
          }} 
        />
        {/* Subtle, soft left vignette on desktop only for text legibility without blacking out or shifting the image */}
        <div 
          className="absolute inset-0 hidden md:block pointer-events-none" 
          style={{
            background: 'linear-gradient(to right, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.18) 35%, transparent 65%)'
          }} 
        />
        {/* Top subtle fade for header transition */}
        <div 
          className="absolute inset-x-0 top-0 h-16 pointer-events-none" 
          style={{
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, transparent 100%)'
          }} 
        />

        {/* Content Info */}
        <div className="absolute inset-0 p-4 sm:p-7 md:p-8 flex flex-col justify-end z-10 max-w-xl">
          {/* Top Tag Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md border border-white/20">
              {typeInfo.label}
            </span>

            {releaseYear && (
              <span className="text-xs font-medium text-white/80">
                {releaseYear}
              </span>
            )}

            {rating !== undefined && rating > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                <span>★</span>
                <span>{rating}</span>
              </span>
            )}

            {isUserItem && item.genre && (
              <span className="text-xs font-normal text-white/70 hidden sm:inline">
                • {item.genre}
              </span>
            )}

            {isUserItem && item.duration && (
              <span className="text-xs font-normal text-white/70 hidden sm:inline">
                • {Math.floor(item.duration / 60) > 0 ? `${Math.floor(item.duration / 60)}s ` : ''}{item.duration % 60 > 0 ? `${item.duration % 60}dk` : ''}
              </span>
            )}

            {isUserItem && item.type === 'series' && item.totalSeasons && (
              <span className="text-xs font-normal text-white/70 hidden sm:inline">
                • {item.totalSeasons} Sezon
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow mb-1.5 line-clamp-2">
            {title}
          </h1>

          {/* Overview */}
          {overview && (
            <p className="text-xs sm:text-sm text-white/80 line-clamp-2 font-normal leading-relaxed mb-3.5 max-w-lg">
              {overview}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isUserItem ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenDetails?.(item.id)}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm haptic-tap cursor-pointer"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  <span>İncele</span>
                </button>

                {onNext && (
                  <button
                    type="button"
                    onClick={onNext}
                    className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 bg-black/40 text-white hover:bg-black/60 active:scale-95 transition-all border border-white/20 backdrop-blur-md haptic-tap cursor-pointer"
                    title="Başka bir öneri göster"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span>Başka Öneri</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {isAdded ? (
                  <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 backdrop-blur-md">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Listende Kayıtlı</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isAdding}
                    onClick={() => tmdbItem && onAddToList?.(tmdbItem)}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm haptic-tap cursor-pointer disabled:opacity-50"
                    style={{ background: 'var(--accent)', color: 'white' }}
                  >
                    {isAdding ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
                    className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 bg-black/40 text-white hover:bg-black/60 active:scale-95 transition-all border border-white/20 backdrop-blur-md haptic-tap cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
