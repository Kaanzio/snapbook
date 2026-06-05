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
  const statusRef = useRef<HTMLDivElement>(null);

  const { imageUrl, loading: imageLoading } = usePhotoImage(`watch-poster-${id}`);
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

  const typeInfo = WATCH_TYPE_INFO[item.type];
  const statusInfo = WATCH_STATUS_INFO[item.status];
  const displayYear = item.releaseYear ?? new Date(item.created_at).getFullYear();
  const hasProgress = item.type === 'series' && (item.currentSeason || item.currentEpisode);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-[fadeIn_0.2s_ease-out]"
      style={{ background: 'rgba(0,0,0,0.8)' }}
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full sm:max-w-[600px] text-white overflow-y-auto hide-scrollbar rounded-t-[32px] sm:rounded-3xl shadow-2xl animate-[slideUp_0.35s_cubic-bezier(0.34,1.56,0.64,1)] max-h-[90vh]"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
      >
        {/* Hero Section */}
        <div className="relative w-full h-[55vw] sm:h-[380px] overflow-hidden">
          {imageLoading ? (
            <div className="absolute inset-0 skeleton" />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 20%' }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-white/5">
              <WatchStatusIcon icon={typeInfo.icon} className="w-16 h-16 opacity-20" />
            </div>
          )}
          
          {/* Refined Gradient Overlay */}
          <div 
            className="absolute inset-0" 
            style={{
              background: 'linear-gradient(to top, var(--bg-card) 0%, rgba(0,0,0,0) 80%)'
            }} 
          />

          {/* Play Trailer Button */}
          {item.trailerUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <a
                href={item.trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto transition-transform duration-300 hover:scale-105 mt-8"
                title="Fragmanı İzle"
              >
                <div className="flex items-center gap-2 px-5 py-2.5 bg-black/60 backdrop-blur-md rounded-full text-white/95 transition-colors duration-300 hover:bg-[#ff0000] shadow-2xl border border-white/20">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="text-[13px] font-bold tracking-wider uppercase">Fragmanı İzle</span>
                </div>
              </a>
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/70 haptic-tap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Section */}
        <div className="px-6 sm:px-10 -mt-16 relative z-10 pb-10">
          {/* Header Info */}
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
              {item.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              <span>{displayYear}</span>
              <span className="w-1 h-1 rounded-full" style={{ background: 'var(--text-tertiary)' }} />
              <span>{typeInfo.label}</span>
              {item.genre && (
                <>
                  <span className="w-1 h-1 rounded-full" style={{ background: 'var(--text-tertiary)' }} />
                  <span>{item.genre}</span>
                </>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 mb-8">
            <div ref={statusRef} className="relative flex-1">
              <button
                onClick={() => setShowStatusMenu(v => !v)}
                className="w-full py-3 px-4 flex items-center justify-center gap-2 rounded-2xl transition-all haptic-tap font-bold text-sm"
                style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}
              >
                <WatchStatusIcon icon={statusInfo.icon} className="w-5 h-5" />
                {statusInfo.label}
              </button>
              {showStatusMenu && (
                <div 
                  className="absolute bottom-full right-0 mb-2 w-48 p-2 rounded-2xl shadow-xl z-50 animate-[slideDown_0.15s_ease-out]"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                >
                  {(Object.entries(WATCH_STATUS_INFO) as [WatchStatus, typeof WATCH_STATUS_INFO[WatchStatus]][]).map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left"
                      style={{ 
                        color: item.status === key ? info.color : 'var(--text-primary)', 
                        background: item.status === key ? `${info.color}15` : 'transparent' 
                      }}
                    >
                      <WatchStatusIcon icon={info.icon} className="w-4 h-4 shrink-0" />
                      <span className="font-medium">{info.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleDelete}
              className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all haptic-tap"
              style={{ background: 'var(--bg-secondary)', color: '#ef4444' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {item.rating && (
                <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>PUAN</div>
                  <div className="font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <span className="text-[#f5c518]">IMDb</span> {item.rating}/10
                  </div>
                </div>
              )}
              {item.duration && (
                <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>SÜRE</div>
                  <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {Math.floor(item.duration / 60) > 0 ? `${Math.floor(item.duration / 60)}s ` : ''}
                    {item.duration % 60 > 0 ? `${item.duration % 60}dk` : ''}
                  </div>
                </div>
              )}
              {hasProgress && (
                <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>İLERLEME</div>
                  <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {item.currentSeason ? `S${item.currentSeason} ` : ''}
                    {item.currentEpisode ? `E${item.currentEpisode}` : ''}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {item.description}
              </p>
            )}

            {/* Note */}
            {item.note && (
              <div className="p-4 rounded-2xl border-l-4" style={{ background: 'var(--bg-secondary)', borderLeftColor: 'var(--accent)' }}>
                <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>{item.note}</p>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {item.tags.map(tag => (
                  <span key={tag} className="px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
