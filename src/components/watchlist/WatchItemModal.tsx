'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { WatchItem, WATCH_STATUS_INFO, WATCH_TYPE_INFO, WatchStatus } from '@/types';
import { getWatchItem, deleteWatchItem, deleteLocalPhoto, updateWatchItem, notifyDataChange } from '@/lib/indexeddb';
import { usePhotoImage } from '@/hooks/usePhotoImage';
import { showToast } from '@/components/ui/Toast';
import { useDialog } from '@/components/providers/DialogProvider';

interface WatchItemModalProps {
  id: string;
  onClose: () => void;
}

export default function WatchItemModal({ id, onClose }: WatchItemModalProps) {
  const [item, setItem] = useState<WatchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

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
    
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [id]);

  const handleDelete = async () => {
    if (!id || !(await confirm('Bu kaydı silmek istediğinize emin misiniz?'))) return;
    
    await deleteWatchItem(id);
    try {
      await deleteLocalPhoto(`watch-poster-${id}`);
    } catch { } // Ignore if no photo
    
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

  if (loading) return null; // Or a subtle loader

  if (!item) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
        <div className="bg-[var(--bg-card)] p-6 rounded-2xl max-w-sm w-full text-center">
          <p>Kayıt bulunamadı.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-white/10 rounded-lg">Kapat</button>
        </div>
      </div>
    );
  }

  const typeInfo = WATCH_TYPE_INFO[item.type];
  const year = new Date(item.created_at).getFullYear();

  return (
    <div className="fixed inset-0 z-50 flex justify-center p-0 sm:p-4 md:p-8 lg:p-12 animate-[fadeIn_0.2s_ease-out]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div 
        className="relative w-full max-w-3xl h-full sm:h-auto sm:max-h-[90vh] bg-[#141414] text-white overflow-y-auto sm:rounded-2xl shadow-2xl hide-scrollbar animate-[slideUp_0.3s_ease-out]"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-[#181818]/60 text-white hover:bg-white hover:text-black transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Hero Image Section */}
        <div className="relative w-full h-[40vh] sm:h-[45vh] min-h-[300px]">
          {imageLoading ? (
            <div className="absolute inset-0 skeleton" />
          ) : imageUrl ? (
            <img src={imageUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover object-top" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#181818]">
              <span className="text-6xl opacity-20">{typeInfo.icon}</span>
            </div>
          )}
          {/* Gradient overlay to fade into content background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
          
          {/* Title and main info superimposed on the image bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
            <h1 className="text-3xl sm:text-5xl font-bold mb-4 drop-shadow-xl">{item.title}</h1>
            
            <div className="flex flex-wrap items-center gap-3 text-sm sm:text-base font-medium">
              <span className="text-green-500 font-bold">{year}</span>
              {item.rating && (
                <span className="px-1.5 py-0.5 border border-white/40 rounded-sm text-xs opacity-90">⭐ {item.rating}</span>
              )}
              {item.type === 'series' && item.currentSeason && (
                <span className="opacity-90">{item.currentSeason}. Sezon</span>
              )}
              <span className="px-1.5 py-0.5 border border-white/40 rounded-sm text-xs opacity-90 uppercase tracking-widest">{typeInfo.label}</span>
              {item.genre && (
                <span className="opacity-90">{item.genre}</span>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-10 pt-0 flex flex-col md:flex-row gap-8">
          
          {/* Main Info Column */}
          <div className="flex-1 space-y-6">
            
            {/* Description */}
            <div className="text-sm sm:text-base leading-relaxed opacity-90">
              {item.description ? item.description : 'Bu kayıt için bir konu açıklaması girilmemiş.'}
            </div>
            
            {/* Note */}
            {item.note && (
              <div className="text-sm opacity-70 italic border-l-2 border-accent pl-4">
                &quot;{item.note}&quot;
              </div>
            )}

            {/* Progress (Series Only) */}
            {item.type === 'series' && (item.currentSeason || item.currentEpisode) && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="text-xs uppercase tracking-widest opacity-60 mb-2">İlerleme</div>
                <div className="flex items-center gap-6">
                  {item.currentSeason && (
                    <div>
                      <span className="text-xl font-bold">{item.currentSeason}</span>
                      <span className="opacity-60 text-sm ml-1">Sezon</span>
                    </div>
                  )}
                  {item.currentEpisode && (
                    <div>
                      <span className="text-xl font-bold">{item.currentEpisode}</span>
                      <span className="opacity-60 text-sm ml-1">Bölüm</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 opacity-80">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <Link 
                href={`/watchlist/edit?id=${id}`}
                className="flex items-center gap-2 px-6 py-3 bg-[#E50914] hover:bg-[#b80710] text-white font-bold rounded-md transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
                Düzenle
              </Link>
              
              <div className="relative">
                <button 
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="flex items-center justify-center w-12 h-12 rounded-full border border-white/40 hover:border-white transition-colors bg-black/40"
                  title="Durumu Değiştir"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
                
                {showStatusMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 p-2 rounded-xl bg-[#2b2b2b] shadow-2xl border border-white/10 z-50">
                    {(Object.entries(WATCH_STATUS_INFO) as [WatchStatus, { label: string; icon: string; color: string }][]).map(([key, info]) => (
                      <button
                        key={key}
                        onClick={() => handleStatusChange(key)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/10 text-left"
                        style={{ color: item.status === key ? info.color : 'white' }}
                      >
                        <span className="text-lg">{info.icon}</span>
                        {info.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={handleDelete}
                className="flex items-center justify-center w-12 h-12 rounded-full border border-white/40 hover:border-white hover:text-red-500 hover:border-red-500 transition-colors bg-black/40 ml-auto"
                title="Sil"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
          </div>
          
          {/* Metadata Column */}
          <div className="md:w-64 space-y-4 text-sm">
            <div>
              <span className="opacity-60 block mb-1">Durum:</span>
              <span className="font-medium flex items-center gap-2">
                <span className="text-xl">{WATCH_STATUS_INFO[item.status].icon}</span>
                {WATCH_STATUS_INFO[item.status].label}
              </span>
            </div>
            {item.totalSeasons && (
              <div>
                <span className="opacity-60 block mb-1">Toplam Sezon:</span>
                <span className="font-medium">{item.totalSeasons}</span>
              </div>
            )}
            {item.totalEpisodes && (
              <div>
                <span className="opacity-60 block mb-1">Toplam Bölüm:</span>
                <span className="font-medium">{item.totalEpisodes}</span>
              </div>
            )}
            <div>
              <span className="opacity-60 block mb-1">Listeye Eklenme:</span>
              <span className="font-medium">{new Date(item.created_at).toLocaleDateString('tr-TR')}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
