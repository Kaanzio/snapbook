'use client';

import { useEffect, useState, useRef } from 'react';
import { WatchItem, WATCH_STATUS_INFO, WATCH_TYPE_INFO, WatchStatus } from '@/types';
import { getWatchItem, deleteWatchItem, deleteLocalPhoto, updateWatchItem, notifyDataChange } from '@/lib/indexeddb';
import { usePhotoImage } from '@/hooks/usePhotoImage';
import { showToast } from '@/components/ui/Toast';
import { useDialog } from '@/components/providers/DialogProvider';
import { WatchStatusIcon } from '@/components/watchlist/WatchIcons';

interface WatchItemModalProps {
  id: string;
  onClose: () => void;
}

export default function WatchItemModal({ id, onClose }: WatchItemModalProps) {
  const [item, setItem] = useState<WatchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  const { imageUrl: localImageUrl, loading: imageLoadingLocal } = usePhotoImage(`watch-poster-${id}`);
  const { confirm } = useDialog();

  useEffect(() => {
    if (id) {
      getWatchItem(id).then(data => {
        if (data) setItem(data);
        setLoading(false);
      });
    } else {
      setTimeout(() => setLoading(false), 0);
    }
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, [id]);

  // Close status menu on outside click
  useEffect(() => {
    if (!showStatusMenu) return;
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStatusMenu]);

  const handleDelete = async () => {
    if (!id || !(await confirm('Bu kaydı silmek istediğinize emin misiniz?'))) return;
    await deleteWatchItem(id);
    try { await deleteLocalPhoto(`watch-poster-${id}`); } catch {}
    notifyDataChange('watchlist');
    showToast('Kayıt silindi');
    onClose();
  };

  const handleStatusChange = async (newStatus: WatchStatus) => {
    if (!id || !item) return;
    await updateWatchItem(id, { status: newStatus });
    setItem({ ...item, status: newStatus });
    notifyDataChange('watchlist');
    setShowStatusMenu(false);
    showToast('Durum güncellendi');
  };

  if (loading) return null;

  if (!item) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
        <div className="p-6 rounded-2xl max-w-sm w-full text-center" style={{ background: 'var(--bg-card)' }}>
          <p style={{ color: 'var(--text-primary)' }}>Kayıt bulunamadı.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Kapat</button>
        </div>
      </div>
    );
  }

  const imageUrl = item.posterUrl || localImageUrl;
  const imageLoading = !item.posterUrl && imageLoadingLocal;
  const typeInfo = WATCH_TYPE_INFO[item.type];
  const statusInfo = WATCH_STATUS_INFO[item.status];
  const displayYear = item.releaseYear ?? new Date(item.created_at).getFullYear();
  
  const hasSeriesProgress = item.type === 'series' && item.currentEpisode !== undefined && item.totalEpisodes !== undefined && item.totalEpisodes > 0;
  const progressPercent = hasSeriesProgress ? Math.min(100, Math.round((item.currentEpisode! / item.totalEpisodes!) * 100)) : 0;

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const ytId = item.trailerUrl ? extractYouTubeId(item.trailerUrl) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-[fadeIn_0.2s_ease-out] overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.8)' }}
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full sm:max-w-[700px] text-white overflow-y-auto hide-scrollbar rounded-t-[32px] sm:rounded-3xl shadow-2xl animate-[slideUp_0.35s_cubic-bezier(0.34,1.56,0.64,1)] h-[90vh]"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
      >
        {/* HERO BACKDROP (Netflix Style) */}
        <div className="relative w-full h-[55vw] sm:h-[350px] bg-black/50 shrink-0">
          {item.backdropUrl ? (
            <img
              src={item.backdropUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 10%', filter: 'brightness(0.85)' }}
            />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover blur-3xl scale-125 opacity-40"
            />
          ) : null}
          
          {/* Top-to-Bottom Gradient Overlay */}
          <div 
            className="absolute inset-0" 
            style={{
              background: 'linear-gradient(to top, var(--bg-card) 0%, rgba(0,0,0,0) 100%)'
            }} 
          />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/70 haptic-tap z-20"
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
              {imageLoading ? (
                <div className="absolute inset-0 skeleton" />
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-white/5">
                  <WatchStatusIcon icon={typeInfo.icon} className="w-10 h-10 opacity-20" />
                </div>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="flex flex-col pb-2 z-20">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2 leading-tight drop-shadow-md" style={{ color: 'var(--text-primary)' }}>
                {item.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[11px] sm:text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                <span className="px-1.5 py-0.5 rounded uppercase" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {typeInfo.label}
                </span>
                <span className="opacity-80">{displayYear}</span>
                {item.genre && (
                  <>
                    <span className="w-1 h-1 rounded-full opacity-50 bg-current" />
                    <span className="opacity-80">{item.genre}</span>
                  </>
                )}
                {item.rating && (
                  <>
                    <span className="w-1 h-1 rounded-full opacity-50 bg-current" />
                    <span className="flex items-center gap-1 text-[#f5c518]">
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      {item.rating}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 mb-8">
            <div ref={statusRef} className="relative flex-1">
              <button
                onClick={() => setShowStatusMenu(v => !v)}
                className="w-full py-3.5 px-4 flex items-center justify-center gap-2 rounded-2xl transition-all haptic-tap font-bold text-sm shadow-sm"
                style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}
              >
                <WatchStatusIcon icon={statusInfo.icon} className="w-5 h-5" />
                {statusInfo.label}
              </button>
              {showStatusMenu && (
                <div 
                  className="absolute top-full left-0 mt-2 w-full p-2 rounded-2xl shadow-xl z-50 animate-[slideDown_0.15s_ease-out]"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                >
                  {(Object.entries(WATCH_STATUS_INFO) as [WatchStatus, typeof WATCH_STATUS_INFO[WatchStatus]][]).map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors text-left"
                      style={{ 
                        color: item.status === key ? info.color : 'var(--text-primary)', 
                        background: item.status === key ? `${info.color}15` : 'transparent' 
                      }}
                    >
                      <WatchStatusIcon icon={info.icon} className="w-5 h-5 shrink-0" />
                      <span className="font-medium">{info.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {ytId && (
              <button
                onClick={() => setShowTrailer(true)}
                className="w-14 h-14 flex items-center justify-center rounded-2xl transition-all haptic-tap shadow-sm hover:scale-105"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </button>
            )}

            <button
              onClick={handleDelete}
              className="w-14 h-14 flex items-center justify-center rounded-2xl transition-all haptic-tap"
              style={{ background: 'var(--bg-secondary)', color: '#ef4444' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Unified Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              
              {/* Total Seasons (Series Only) */}
              {item.type === 'series' && item.totalSeasons && (
                <div className="p-3.5 rounded-2xl flex flex-col justify-center" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>TOPLAM SEZON</div>
                  <div className="text-xl font-black text-accent">{item.totalSeasons}</div>
                </div>
              )}

              {/* Total Episodes (Series Only) */}
              {item.type === 'series' && item.totalEpisodes && (
                <div className="p-3.5 rounded-2xl flex flex-col justify-center relative overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>TOPLAM BÖLÜM</div>
                  <div className="text-xl font-black text-accent">{item.totalEpisodes}</div>
                </div>
              )}

              {/* Duration */}
              {item.duration && (
                <div className="p-3.5 rounded-2xl flex flex-col justify-center" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>SÜRE</div>
                  <div className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                    {Math.floor(item.duration / 60) > 0 ? `${Math.floor(item.duration / 60)}s ` : ''}
                    {item.duration % 60 > 0 ? `${item.duration % 60}dk` : ''}
                  </div>
                </div>
              )}

              {/* Rating */}
              {item.rating !== undefined && item.rating > 0 && (
                <div className="p-3.5 rounded-2xl flex flex-col justify-center" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>IMDB / PUAN</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-[#f5c518]">{item.rating}</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>/ 10</span>
                  </div>
                </div>
              )}

            </div>

            {/* Description */}
            {item.description && (
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>KONU / ÖZET</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {item.description}
                </p>
              </div>
            )}

            {/* Note */}
            {item.note && (
              <div className="p-4 rounded-2xl border-l-4" style={{ background: 'var(--bg-secondary)', borderLeftColor: 'var(--accent)' }}>
                <h3 className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>KİŞİSEL NOTUNUZ</h3>
                <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>{item.note}</p>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {item.tags.map(tag => (
                  <span key={tag} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cinematic Trailer Overlay */}
        {showTrailer && ytId && (
          <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-[fadeIn_0.2s_ease-out]">
            <div className="w-full max-w-4xl px-4 sm:px-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold text-lg sm:text-xl line-clamp-1">{item.title} - Fragman</h3>
                <button 
                  onClick={() => setShowTrailer(false)}
                  className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors haptic-tap"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10">
                <iframe 
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
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
  );
}
