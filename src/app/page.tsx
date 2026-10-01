'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { usePhotos } from '@/hooks/usePhotos';
import { useCollections } from '@/hooks/useCollections';
import { useCategories } from '@/hooks/useCategories';
import { useSearch } from '@/hooks/useSearch';
import { usePreferences } from '@/components/providers/PreferencesProvider';
import MasonryGrid from '@/components/photos/MasonryGrid';
import FilterPanel from '@/components/search/FilterPanel';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import BottomSheet from '@/components/ui/BottomSheet';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import UploadModal from '@/components/upload/UploadModal';
import { deletePhotos } from '@/lib/storage';
import { getPhoto } from '@/lib/indexeddb';
import { useDialog } from '@/components/providers/DialogProvider';
import { showToast } from '@/components/ui/Toast';
import { FilterState } from '@/types';

export default function HomePage() {
  const { photos, loading } = usePhotos();
  const { collections } = useCollections();
  const { categories } = useCategories();
  const { prefs, updatePrefs } = usePreferences();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const { confirm } = useDialog();

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
    sortBy: 'date_desc',
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
      
      showToast('İndirme tamamlandı');
      setIsSelectionMode(false);
      setSelectedPhotoIds(new Set());
    } catch (e) {
      console.error(e);
      showToast('İndirme sırasında bir hata oluştu', 'error');
    }
  };

  const hasActiveFilters = filters.category !== 'all' || filters.starred !== null || filters.collectionId !== null;

  return (
    <div className="min-h-screen page-enter pb-24">
      {/* Upload Modal */}
      {isUploadOpen && <UploadModal onClose={() => setIsUploadOpen(false)} />}

      {/* ─── Unified Premium Sticky Header ─── */}
      <header className="sticky top-0 z-30 transition-all duration-300 themed-header pt-4 lg:pt-6 pb-2.5 lg:pb-3.5">
        <div className="px-4 lg:px-6 flex flex-col gap-3">
          
          {/* Top Row: Title, Quick Count & Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                Fotoğraflar
              </h1>
              <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {loading ? 'Yükleniyor...' : `${filteredPhotos.length} / ${photos.length} anı`}
              </p>
            </div>
            
            {/* Header Right Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {!isSelectionMode ? (
                <>
                  {/* Select Mode Toggle */}
                  <button
                    onClick={() => setIsSelectionMode(true)}
                    className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-xl transition-all haptic-tap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                    title="Fotoğraf Seç"
                  >
                    <svg className="w-4 h-4 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline text-xs font-bold ml-1.5">Seç</span>
                  </button>

                  {/* Grid Density Toggle */}
                  <button
                    onClick={toggleDensity}
                    className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-xl transition-all haptic-tap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                    title="Görünüm Yoğunluğu (Kompakt / Rahat / Büyük)"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {prefs.gridDensity === 'compact' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />}
                      {prefs.gridDensity === 'comfortable' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />}
                      {prefs.gridDensity === 'large' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />}
                    </svg>
                    <span className="hidden sm:inline text-xs font-bold ml-1.5">
                      {prefs.gridDensity === 'compact' ? 'Kompakt' : prefs.gridDensity === 'comfortable' ? 'Rahat' : 'Büyük'}
                    </span>
                  </button>

                  {/* Add Photo Button */}
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3.5 sm:py-2 rounded-xl transition-all haptic-tap cursor-pointer shadow-md hover:scale-105 active:scale-95 shrink-0"
                    style={{ background: 'var(--accent)', color: 'var(--accent-foreground, #FFFFFF)' }}
                    title="Fotoğraf Ekle"
                  >
                    <svg className="w-4 h-4 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="hidden sm:inline text-xs font-bold ml-1.5">Ekle</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Select All */}
                  <button
                    onClick={() => setSelectedPhotoIds(new Set(filteredPhotos.map(p => p.id)))}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all haptic-tap cursor-pointer"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    Tümünü Seç
                  </button>
                  {/* Cancel Selection */}
                  <button
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedPhotoIds(new Set());
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all haptic-tap cursor-pointer"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--accent)' }}
                  >
                    Vazgeç
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search Row & Quick Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full pt-1">
            {/* Integrated Compact Search Bar */}
            <div className="relative group shrink-0 w-full sm:w-72 max-w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-accent z-10" style={{ color: 'var(--text-tertiary)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Fotoğraf veya not ara..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full pl-10 pr-10 py-2 rounded-xl text-xs sm:text-sm font-medium outline-none transition-all duration-300 themed-input"
                style={{ color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
              />
              {filters.searchQuery ? (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                  className="absolute inset-y-0 right-1.5 pr-2 pl-2 flex items-center haptic-tap cursor-pointer hover:scale-110 transition-transform z-10"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <div className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </button>
              ) : null}
            </div>

            {/* Quick Category Carousel / Horizontal Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {/* Tümü */}
              <button
                onClick={() => setFilters(prev => ({ ...prev, category: 'all', starred: null }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 haptic-tap cursor-pointer shrink-0 border ${
                  filters.category === 'all' && !filters.starred
                    ? 'border-transparent shadow-sm'
                    : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{
                  background: filters.category === 'all' && !filters.starred ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: filters.category === 'all' && !filters.starred ? 'var(--accent-foreground, #FFFFFF)' : 'var(--text-secondary)',
                }}
              >
                Tümü
              </button>

              {/* Favoriler Filter */}
              <button
                onClick={() => setFilters(prev => ({ ...prev, starred: prev.starred ? null : true }))}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 haptic-tap cursor-pointer shrink-0 border ${
                  filters.starred
                    ? 'border-transparent shadow-sm'
                    : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{
                  background: filters.starred ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: filters.starred ? 'var(--accent-foreground, #FFFFFF)' : 'var(--text-secondary)',
                }}
              >
                <svg className={`w-3.5 h-3.5 ${filters.starred ? 'text-white fill-white' : 'text-amber-400 fill-amber-400'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                <span>Favoriler</span>
              </button>

              {/* Dynamic Categories */}
              {categories.map((cat) => {
                const isActive = filters.category === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setFilters(prev => ({ ...prev, category: isActive ? 'all' : cat.key }))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 haptic-tap cursor-pointer shrink-0 border ${
                      isActive
                        ? 'border-transparent shadow-sm'
                        : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                    style={{
                      background: isActive ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: isActive ? 'var(--accent-foreground, #FFFFFF)' : 'var(--text-secondary)',
                    }}
                  >
                    <CategoryIcon categoryKey={cat.key} className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="pt-2 px-1 lg:px-2">
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1.5 lg:gap-2 px-1">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-square skeleton rounded-xl" />
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
            title={photos.length === 0 ? 'Henüz fotoğraf eklenmedi' : 'Sonuç bulunamadı'}
            description={
              photos.length === 0
                ? 'Anılarınızı ölümsüzleştirmek için ilk fotoğrafınızı ekleyin.'
                : 'Arama veya kategori filtrelerinizi temizleyerek tekrar deneyin.'
            }
            action={
              photos.length === 0 ? (
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-md haptic-tap cursor-pointer"
                  style={{ background: 'var(--accent)', color: 'var(--accent-foreground, white)' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  İlk Fotoğrafı Ekle
                </button>
              ) : (
                <button
                  onClick={() => setFilters({ category: 'all', starred: null, collectionId: null, searchQuery: '', tags: [], sortBy: 'date_desc' })}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all haptic-tap cursor-pointer"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--accent)' }}
                >
                  Filtreleri Sıfırla
                </button>
              )
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
      </main>

      {/* ─── Floating Bulk Actions Bar (Selection Mode) ─── */}
      {isSelectionMode && selectedPhotoIds.size > 0 && (
        <div className="fixed bottom-20 lg:bottom-10 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm animate-[springIn_0.3s_ease-out]">
          <div className="backdrop-blur-2xl rounded-2xl shadow-2xl p-2.5 flex items-center justify-between border" style={{ background: 'var(--bg-nav)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}>
            <div className="px-3 font-bold text-xs sm:text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>{selectedPhotoIds.size} fotoğraf seçildi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleBulkDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors haptic-tap cursor-pointer text-xs font-bold"
                style={{ color: 'var(--text-primary)' }}
                title="İndir (ZIP)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span>İndir</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors haptic-tap cursor-pointer text-xs font-bold"
                title="Sil"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <span>Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Floating Action Button (More Filters & Collections) ─── */}
      {!loading && !isSelectionMode && (
        <button
          onClick={() => setIsFilterOpen(true)}
          className="fixed bottom-20 lg:bottom-8 right-6 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 haptic-tap cursor-pointer"
          style={{ background: 'var(--accent)', color: 'var(--accent-foreground, white)' }}
          title="Tüm Filtreler ve Sıralama"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          {/* Badge for active filters */}
          {hasActiveFilters && (
            <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-red-500 border-2" style={{ borderColor: 'var(--bg-primary)' }} />
          )}
        </button>
      )}

      {/* ─── Filter Modals (Desktop & Mobile) ─── */}
      <div className="hidden lg:block">
        <Modal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filtreler ve Sıralama">
          <FilterPanel filters={filters} onChange={setFilters} collections={collections} totalPhotos={photos.length} />
        </Modal>
      </div>
      <div className="lg:hidden">
        <BottomSheet isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filtreler ve Sıralama">
          <FilterPanel filters={filters} onChange={setFilters} collections={collections} totalPhotos={photos.length} />
        </BottomSheet>
      </div>

    </div>
  );
}
