'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { usePhotos } from '@/hooks/usePhotos';
import { useCollections } from '@/hooks/useCollections';
import { useSearch } from '@/hooks/useSearch';
import { usePreferences } from '@/components/providers/PreferencesProvider';
import MasonryGrid from '@/components/photos/MasonryGrid';
import FilterPanel from '@/components/search/FilterPanel';
import EmptyState from '@/components/ui/EmptyState';
import { useWatchlist } from '@/hooks/useWatchlist';
import { FilterState } from '@/types';
import Link from 'next/link';

import UploadModal from '@/components/upload/UploadModal';
import { deletePhotos } from '@/lib/storage';
import { getPhoto } from '@/lib/indexeddb';
import { useDialog } from '@/components/providers/DialogProvider';
import { showToast } from '@/components/ui/Toast';

export default function HomePage() {
  const { photos, loading } = usePhotos();
  const { collections } = useCollections();
  const { items: watchlist } = useWatchlist();
  const { prefs, updatePrefs } = usePreferences();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const { confirm } = useDialog();

  const toggleDensity = () => {
    const modes = ['compact', 'normal', 'large'];
    const currentIndex = modes.indexOf(prefs.gridDensity);
    const nextMode = modes[(currentIndex + 1) % modes.length] as any;
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

  const handleToggleSelect = (photoId: string) => {
    setSelectedPhotoIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      if (newSet.size === 0) setIsSelectionMode(false);
      return newSet;
    });
  };

  const handleLongPress = (photoId: string) => {
    setIsSelectionMode(true);
    setSelectedPhotoIds(new Set([photoId]));
  };

  const handleBulkDelete = async () => {
    if (selectedPhotoIds.size === 0) return;
    if (await confirm(`${selectedPhotoIds.size} fotoğrafı silmek istediğinize emin misiniz?`)) {
      await deletePhotos(Array.from(selectedPhotoIds));
      showToast(`${selectedPhotoIds.size} fotoğraf silindi`);
      setIsSelectionMode(false);
      setSelectedPhotoIds(new Set());
    }
  };

  const handleBulkDownload = async () => {
    if (selectedPhotoIds.size === 0) return;
    showToast('Fotoğraflar hazırlanıyor...', 'info');
    try {
      const zip = new JSZip();
      const ids = Array.from(selectedPhotoIds);
      
      for (const id of ids) {
        const file = await getPhoto(id);
        const meta = photos.find(p => p.id === id);
        if (file) {
          const extension = file.type.split('/')[1] || 'jpg';
          const filename = meta?.note ? `${meta.note}.${extension}` : `photo_${id}.${extension}`;
          zip.file(filename, file);
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snapbook_fotograflar.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('İndirme başlatıldı');
      setIsSelectionMode(false);
      setSelectedPhotoIds(new Set());
    } catch (e) {
      console.error(e);
      showToast('İndirme sırasında bir hata oluştu', 'error');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Upload Modal */}
      {isUploadOpen && <UploadModal onClose={() => setIsUploadOpen(false)} />}

      {/* Unified Sticky Header */}
      <header className="sticky top-0 z-30 transition-all duration-300 themed-header pt-8 lg:pt-6 pb-2 lg:pb-3">
        <div className="px-4 lg:px-6 flex flex-col gap-4">
          
          {/* Top Row: Title & Actions */}
          {!loading && (
            <div className="animate-[fade-in_0.5s_ease-out] flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Fotoğraflar
                </h1>
                <p className="text-sm font-medium mt-0.5 opacity-60" style={{ color: 'var(--text-primary)' }}>
                  {photos.length} fotoğraf
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {!isSelectionMode ? (
                  <button
                    onClick={() => setIsSelectionMode(true)}
                    className="py-2.5 px-4 rounded-full transition-all duration-300 haptic-tap shadow-sm hover:scale-105 active:scale-95 inline-flex items-center gap-2 font-semibold text-sm bg-black/5 dark:bg-white/5"
                    title="Seç"
                  >
                    <svg className="w-5 h-5 text-slate-700 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline" style={{ color: 'var(--text-primary)' }}>Seç</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedPhotoIds(new Set(filteredPhotos.map(p => p.id)))}
                      className="py-2.5 px-4 rounded-full transition-all duration-300 haptic-tap shadow-sm hover:scale-105 active:scale-95 inline-flex items-center gap-2 font-semibold text-sm bg-black/5 dark:bg-white/5"
                    >
                      <span style={{ color: 'var(--text-primary)' }}>Tümünü Seç</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedPhotoIds(new Set());
                      }}
                      className="py-2.5 px-4 rounded-full transition-all duration-300 haptic-tap shadow-sm hover:scale-105 active:scale-95 inline-flex items-center gap-2 font-semibold text-sm bg-black/5 dark:bg-white/5"
                    >
                      <span style={{ color: 'var(--text-primary)' }}>İptal</span>
                    </button>
                  </>
                )}

                {!isSelectionMode && (
                  <button
                    onClick={toggleDensity}
                    className="py-2.5 px-4 rounded-full transition-all duration-300 haptic-tap shadow-sm hover:scale-105 active:scale-95 inline-flex items-center gap-2 font-semibold text-sm bg-black/5 dark:bg-white/5"
                    title="Görünümü Değiştir"
                  >
                    <svg className="w-5 h-5 text-slate-700 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {prefs.gridDensity === 'compact' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />}
                      {prefs.gridDensity === 'normal' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />}
                      {prefs.gridDensity === 'large' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />}
                    </svg>
                    <span className="hidden sm:inline" style={{ color: 'var(--text-primary)' }}>
                      {prefs.gridDensity === 'compact' ? 'Kompakt' : prefs.gridDensity === 'normal' ? 'Rahat' : 'Büyük'}
                    </span>
                  </button>
                )}

                {!isSelectionMode && (
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="py-2.5 px-4 rounded-full transition-all duration-300 haptic-tap shadow-sm hover:scale-105 active:scale-95 inline-flex items-center gap-2 font-semibold text-sm"
                    style={{ background: 'var(--accent)', color: 'var(--accent-foreground, white)' }}
                    title="Fotoğraf Ekle"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="hidden sm:inline">Ekle</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bottom Row: Filters */}
          <div className="animate-[fade-in_0.5s_ease-out]">
            <FilterPanel 
              filters={filters} 
              onChange={setFilters} 
              collections={collections} 
              totalPhotos={photos.length}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="pt-2 pb-8">
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1 lg:gap-1.5 px-1 lg:px-1.5">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-800 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : filteredPhotos.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            }
            title={photos.length === 0 ? 'Henüz fotoğraf yok' : 'Sonuç bulunamadı'}
            description={
              photos.length === 0
                ? 'İlk fotoğrafınızı ekleyerek başlayın!'
                : 'Filtreleri değiştirmeyi deneyin'
            }
            action={
              photos.length === 0 ? (
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-md haptic-tap"
                  style={{ background: 'var(--accent)', color: 'var(--accent-foreground, white)' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  İlk Fotoğrafı Ekle
                </button>
              ) : undefined
            }
          />
        ) : (
          <MasonryGrid 
            photos={filteredPhotos} 
            sortBy={filters.sortBy} 
            selectedIds={selectedPhotoIds}
            isSelectionMode={isSelectionMode}
            onToggleSelect={handleToggleSelect}
            onLongPress={handleLongPress}
          />
        )}
      </div>

      {/* Floating Action Bar */}
      {isSelectionMode && selectedPhotoIds.size > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
          <div className="backdrop-blur-xl rounded-full shadow-2xl p-2 flex items-center justify-between" style={{ background: 'var(--bg-nav)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
            <div className="px-4 font-semibold text-sm">
              {selectedPhotoIds.size} seçildi
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleBulkDownload}
                className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors haptic-tap"
                style={{ color: 'var(--text-primary)' }}
                title="İndir (ZIP)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
              <button
                onClick={handleBulkDelete}
                className="w-10 h-10 rounded-full hover:bg-red-500/10 flex items-center justify-center transition-colors haptic-tap"
                style={{ color: 'var(--accent)' }}
                title="Sil"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
