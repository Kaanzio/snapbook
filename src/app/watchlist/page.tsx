'use client';

import { useState, Suspense, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWatchlist } from '@/hooks/useWatchlist';
import { usePreferences } from '@/components/providers/PreferencesProvider';
import WatchCard from '@/components/watchlist/WatchCard';
import EmptyState from '@/components/ui/EmptyState';
import { WatchItem, WatchStatus, WatchItemType, WATCH_STATUS_INFO, WATCH_TYPE_INFO } from '@/types';
import WatchItemModal from '@/components/watchlist/WatchItemModal';
import CreateListModal from '@/components/watchlist/CreateListModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useDialog } from '@/components/providers/DialogProvider';
import { WatchStatusIcon } from '@/components/watchlist/WatchIcons';

function WatchlistSlider({ groupItems, cardWidthClass }: { groupItems: WatchItem[], cardWidthClass: string }) {
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
  }, [groupItems]);

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
          className="absolute left-0 top-0 bottom-4 z-50 w-12 lg:w-16 flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
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

      <motion.div 
        layout 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex overflow-x-auto hide-scrollbar gap-3 lg:gap-4 px-4 lg:px-6 pb-4 relative z-0"
      >
        <AnimatePresence>
          {groupItems.map(item => (
            <motion.div 
              layout 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              key={item.id} 
              className={`shrink-0 ${cardWidthClass}`}
            >
              <WatchCard item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Right Scroll Button */}
      {canScrollRight && groupItems.length > 0 && (
        <button 
          type="button"
          onClick={handleScrollRight}
          className="absolute right-0 top-0 bottom-4 z-50 w-12 lg:w-16 flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
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

function WatchlistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewId = searchParams.get('v');
  const { items, customLists, loading, getFilteredItems, addCustomList, editCustomList, removeCustomList, reorderCustomLists } = useWatchlist();
  const { prefs } = usePreferences();
  const { confirm, prompt } = useDialog();

  const [statusFilter, setStatusFilter] = useState<WatchStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<WatchItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'rating-desc' | 'duration-desc' | 'duration-asc'>('date-desc');
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const filteredItems = getFilteredItems({
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    searchQuery: searchQuery.trim() || undefined,
  });

  const displayItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'date-asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'title-asc': return a.title.localeCompare(b.title, 'tr');
      case 'title-desc': return b.title.localeCompare(a.title, 'tr');
      case 'rating-desc': return (b.rating || 0) - (a.rating || 0);
      case 'duration-desc': return (b.duration || 0) - (a.duration || 0);
      case 'duration-asc': return (a.duration || 0) - (b.duration || 0);
      default: return 0;
    }
  });

  const sortLabels: Record<string, string> = {
    'date-desc': 'En Yeni',
    'date-asc': 'En Eski',
    'title-asc': 'A → Z',
    'title-desc': 'Z → A',
    'rating-desc': 'Puan',
    'duration-desc': 'Süre (Uzun)',
    'duration-asc': 'Süre (Kısa)',
  };

  // Card width based on density
  let cardWidthClass = 'w-40 sm:w-48 md:w-56 lg:w-64';
  if (prefs.gridDensity === 'compact') cardWidthClass = 'w-36 sm:w-40 md:w-48 lg:w-56';
  else if (prefs.gridDensity === 'large') cardWidthClass = 'w-48 sm:w-56 md:w-64 lg:w-80';


  return (
    <div className="min-h-screen page-enter pb-24">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-30 themed-header shadow-sm pt-8 lg:pt-6 pb-2 lg:pb-3">
        <div className="px-4 lg:px-6">

          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                Kırmızı Perde
              </h1>
              <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                {loading ? 'Yükleniyor...' : `${filteredItems.length} kayıt`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Reorder toggle */}
              {customLists.length > 1 && (
                <button
                  onClick={() => setReorderMode(v => !v)}
                  className={`p-2 rounded-xl transition-colors haptic-tap ${reorderMode ? 'text-accent' : ''}`}
                  style={{
                    background: reorderMode ? 'hsla(var(--accent-h),var(--accent-s),var(--accent-l),0.15)' : 'var(--bg-secondary)',
                    color: reorderMode ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                  title="Listeleri Sırala"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                  </svg>
                </button>
              )}
              {/* New List */}
              <button
                onClick={() => setIsCreateListModalOpen(true)}
                className="px-3 py-2 rounded-xl text-sm font-bold transition-colors haptic-tap flex items-center gap-1.5"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                title="Yeni Liste Oluştur"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="hidden sm:inline">Liste</span>
              </button>
              {/* Add (desktop only) */}
              <Link
                href="/watchlist/add"
                className="hidden lg:flex p-2 rounded-xl transition-colors haptic-tap items-center"
                style={{ background: 'hsla(var(--accent-h),var(--accent-s),var(--accent-l),0.12)', color: 'var(--accent)' }}
                title="Film veya Dizi Ekle"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </Link>
            </div>
          </div>

            {/* Responsive Filter Container */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full">
              
              {/* Top Row (Mobile): Search & Status */}
              <div 
                className="w-full lg:w-auto overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0"
              >
                <div className="flex items-center gap-3 w-max">
              
              {/* ── Modern Compact Search Bar ── */}
              <div className="relative group shrink-0 w-48 sm:w-56">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-accent z-10" style={{ color: 'var(--text-tertiary)' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Film, dizi ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-1.5 rounded-full text-sm font-medium outline-none transition-all duration-300 themed-input"
                  style={{ color: 'var(--text-primary)', boxShadow: 'none' }}
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-1.5 pr-2 pl-2 flex items-center haptic-tap hover:scale-110 transition-transform z-10"
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

              {/* 1. Status Filters */}
              <div className="inline-flex items-center p-1 rounded-[14px] border shrink-0" 
                   style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                {/* All */}
                <button
                  onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-[11px] uppercase tracking-wider font-bold transition-all duration-300 haptic-tap shrink-0 ${
                    statusFilter === 'all' && typeFilter === 'all' ? '' : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{
                    background: statusFilter === 'all' && typeFilter === 'all' ? 'var(--accent)' : 'transparent',
                    color: statusFilter === 'all' && typeFilter === 'all' ? 'var(--accent-foreground, white)' : 'var(--text-secondary)',
                  }}
                >
                  <svg className={`w-3.5 h-3.5 ${statusFilter === 'all' && typeFilter === 'all' ? 'opacity-100' : 'opacity-60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />
                  </svg>
                  Tümü
                </button>

                {/* Status Options */}
                {(Object.entries(WATCH_STATUS_INFO) as [WatchStatus, { label: string; icon: string; color: string }][]).map(([key, info]) => {
                  const isActive = statusFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { setStatusFilter(isActive ? 'all' : key); setTypeFilter('all'); }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-[11px] uppercase tracking-wider font-bold transition-all duration-300 haptic-tap shrink-0 ${
                        isActive ? '' : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      style={{
                        background: isActive ? 'var(--accent)' : 'transparent',
                        color: isActive ? 'var(--accent-foreground, white)' : 'var(--text-secondary)',
                      }}
                    >
                      <div className={isActive ? 'opacity-100' : 'opacity-60'}>
                        <WatchStatusIcon icon={info.icon} className="w-3.5 h-3.5" />
                      </div>
                      {info.label}
                    </button>
                  );
                })}
              </div>

              {/* 2. Type Filters */}
              <div className="inline-flex items-center p-1 rounded-[14px] border shrink-0" 
                   style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                {(Object.entries(WATCH_TYPE_INFO) as [WatchItemType, { label: string; icon: string }][]).map(([key, info]) => {
                  const isActive = typeFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { setTypeFilter(isActive ? 'all' : key); setStatusFilter('all'); }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-[11px] uppercase tracking-wider font-bold transition-all duration-300 haptic-tap shrink-0 ${
                        isActive ? '' : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      style={{
                        background: isActive ? 'var(--accent)' : 'transparent',
                        color: isActive ? 'var(--accent-foreground, white)' : 'var(--text-secondary)',
                      }}
                    >
                      <div className={isActive ? 'opacity-100' : 'opacity-60'}>
                        <WatchStatusIcon icon={info.icon} className="w-3.5 h-3.5" />
                      </div>
                      {info.label}
                    </button>
                  );
                })}
              </div>

              {/* 3. Right Side Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Sort dropdown */}
                <div className="relative flex items-center border rounded-full haptic-tap transition-all hover:bg-black/5 dark:hover:bg-white/5 shrink-0" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="appearance-none inline-flex items-center gap-1.5 pl-4 pr-8 py-1.5 text-[11px] uppercase tracking-wider font-bold bg-transparent cursor-pointer outline-none shrink-0"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {Object.entries(sortLabels).map(([key, label]) => (
                      <option key={key} value={key} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{label}</option>
                    ))}
                  </select>
                  <svg className="w-3.5 h-3.5 absolute right-3 pointer-events-none opacity-60" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
              </div>
              </div>
            </div>

        </div>
      </header>

      {/* ─── CONTENT ─── */}
      <main className="py-2 lg:py-4">
        {(() => {
          if (loading) {
            return (
              <div className="px-4 lg:px-6 flex gap-4 overflow-hidden">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`${cardWidthClass} shrink-0 aspect-[2/3] rounded-xl skeleton`} />
                ))}
              </div>
            );
          }
          if (displayItems.length > 0 || customLists.length > 0) {
            // Search grid
            if (searchQuery.trim() !== '') {
              return (
                <div className="mt-4">
                  <div className="px-4 lg:px-6 mb-4 flex items-baseline gap-3">
                    <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-primary)' }}>Sonuçlar</h2>
                    <span className="text-xs opacity-60" style={{ color: 'var(--text-tertiary)' }}>{displayItems.length} kayıt</span>
                  </div>
                  <motion.div layout className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 sm:gap-4 lg:gap-5 px-4 lg:px-6">
                    <AnimatePresence>
                      {displayItems.map(item => (
                        <motion.div 
                          layout 
                          initial={{ opacity: 0, scale: 0.9 }} 
                          animate={{ opacity: 1, scale: 1 }} 
                          exit={{ opacity: 0, scale: 0.9 }} 
                          key={item.id} 
                          className="w-full"
                        >
                          <WatchCard item={item} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            }

            const renderSection = (title: string, groupItems: typeof displayItems, customListId?: string, sectionIndex?: number) => {
              if (groupItems.length === 0 && !customListId) return null;
              return (
                <div className="mb-8 relative group/list">
                  <div className="flex items-center px-4 lg:px-6 mb-3 gap-2">
                    {/* Reorder arrows for custom lists */}
                    {reorderMode && customListId && sectionIndex !== undefined && (
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          onClick={() => reorderCustomLists(sectionIndex, sectionIndex - 1)}
                          disabled={sectionIndex === 0}
                          className="p-0.5 rounded disabled:opacity-20 hover:opacity-60 transition-opacity haptic-tap"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                          </svg>
                        </button>
                        <button
                          onClick={() => reorderCustomLists(sectionIndex, sectionIndex + 1)}
                          disabled={sectionIndex === customLists.length - 1}
                          className="p-0.5 rounded disabled:opacity-20 hover:opacity-60 transition-opacity haptic-tap"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Drag handle when in reorder mode */}
                    {reorderMode && customListId && (
                      <svg className="w-4 h-4 shrink-0 opacity-40 cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                      </svg>
                    )}

                    <h2 className="text-sm font-bold tracking-widest uppercase flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                      {title}
                      {!reorderMode && (
                        <svg className="w-3.5 h-3.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </h2>
                    <span className="text-[10px] opacity-50 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                      {groupItems.length}
                    </span>

                    {groupItems.length > 0 && !reorderMode && (
                      <Link 
                        href={`/watchlist/list?id=${customListId || 'unlisted'}`}
                        className="ml-3 px-2.5 py-1 rounded-md text-xs font-bold transition-colors haptic-tap"
                        style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}
                      >
                        Tümünü Gör
                      </Link>
                    )}

                    {/* Custom list actions */}
                    {customListId && !reorderMode && (
                      <div className="ml-auto flex items-center gap-1 transition-opacity opacity-40 hover:opacity-100">
                        <button
                          onClick={async () => {
                            const newName = await prompt('Listenin yeni adı:', title);
                            if (newName?.trim()) editCustomList(customListId, newName.trim());
                          }}
                          className="p-1.5 rounded-lg transition-colors haptic-tap hover:bg-black/5 dark:hover:bg-white/5"
                          style={{ color: 'var(--text-tertiary)' }}
                          title="Düzenle"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.89l12.685-12.685z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.862 4.487" />
                          </svg>
                        </button>
                        <button
                          onClick={async () => {
                            if (await confirm(`"${title}" listesini silmek istediğinize emin misiniz?`)) {
                              removeCustomList(customListId);
                            }
                          }}
                          className="p-1.5 rounded-lg transition-colors haptic-tap hover:bg-red-500/10 hover:text-red-500"
                          style={{ color: 'var(--text-tertiary)' }}
                          title="Sil"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Done reorder button */}
                    {reorderMode && customListId && sectionIndex === customLists.length - 1 && (
                      <button
                        onClick={() => setReorderMode(false)}
                        className="ml-auto px-3 py-1 rounded-lg text-xs font-bold transition-colors haptic-tap"
                        style={{ background: 'var(--accent)', color: 'white' }}
                      >
                        Tamam
                      </button>
                    )}
                  </div>

                  {groupItems.length === 0 ? (
                    <div className="px-4 lg:px-6 pb-4">
                      <div
                        className="w-full flex items-center justify-center py-6 rounded-2xl border-dashed border text-sm font-medium"
                        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-tertiary)' }}
                      >
                        Bu liste henüz boş
                      </div>
                    </div>
                  ) : (
                    <WatchlistSlider groupItems={groupItems} cardWidthClass={cardWidthClass} />
                  )}
                </div>
              );
            };

            return (
              <div className="mt-2">
                {customLists.map((list, idx) => {
                  const listItems = displayItems.filter(item => item.listIds?.includes(list.id));
                  return (
                    <div key={list.id}>
                      {renderSection(list.name, listItems, list.id, idx)}
                    </div>
                  );
                })}
                {(() => {
                  const unlistedItems = displayItems.filter(item => !item.listIds || item.listIds.length === 0);
                  if (unlistedItems.length > 0) {
                    return renderSection('Listesiz', unlistedItems, undefined, customLists.length);
                  }
                  return null;
                })()}
              </div>
            );
          }

          // Empty state
          return (
            <div className="mt-12 px-4">
              <EmptyState
                icon={
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                  </svg>
                }
                title={items.length === 0 ? 'Listeniz boş' : 'Sonuç bulunamadı'}
                description={items.length === 0
                  ? 'Henüz hiç film veya dizi eklemediniz.'
                  : 'Arama veya filtre kriterlerinize uygun kayıt bulunamadı.'}
              />
              {items.length === 0 && (
                <div className="mt-4 flex justify-center">
                  <Link href="/watchlist/add" className="btn-accent px-6 py-2.5 rounded-xl font-medium text-sm haptic-tap inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Film veya Dizi Ekle
                  </Link>
                </div>
              )}
            </div>
          );
        })()}
      </main>

      {/* ─── MODALS ─── */}
      {viewId && <WatchItemModal id={viewId} onClose={() => router.push('/watchlist')} />}
      {isCreateListModalOpen && (
        <CreateListModal
          onClose={() => setIsCreateListModalOpen(false)}
          onSubmit={addCustomList}
        />
      )}
    </div>
  );
}

export default function WatchlistPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>}>
      <WatchlistContent />
    </Suspense>
  );
}
