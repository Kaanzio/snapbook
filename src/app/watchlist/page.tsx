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
import Modal from '@/components/ui/Modal';
import BottomSheet from '@/components/ui/BottomSheet';
import { motion, AnimatePresence } from 'framer-motion';
import { useDialog } from '@/components/providers/DialogProvider';
import { WatchStatusIcon } from '@/components/watchlist/WatchIcons';
import HeroBillboard from '@/components/watchlist/HeroBillboard';
import DiscoverView from '@/components/watchlist/DiscoverView';
import FloatingFilterSort from '@/components/ui/FloatingFilterSort';

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'lists' | 'discover'>('lists');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [reorderMode, setReorderMode] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Eligible items for Netflix Hero Billboard (prefer items with backdrops/posters)
  const eligibleHeroItems = items.filter(i => !!i.backdropUrl || !!i.posterUrl);
  const heroItem = eligibleHeroItems.length > 0 
    ? eligibleHeroItems[featuredIndex % eligibleHeroItems.length]
    : (items.length > 0 ? items[featuredIndex % items.length] : null);

  const handleNextHero = () => {
    if (eligibleHeroItems.length > 1) {
      setFeaturedIndex(idx => (idx + 1) % eligibleHeroItems.length);
    }
  };

  const filteredItems = getFilteredItems({
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    searchQuery: searchQuery.trim() || undefined,
  });

  const displayItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc': return (b.releaseYear || 0) - (a.releaseYear || 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'date-asc': return (a.releaseYear || 0) - (b.releaseYear || 0) || new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
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
      <header className="sticky top-0 z-30 themed-header shadow-sm pt-3 sm:pt-5 pb-2.5 sm:pb-3">
        <div className="px-4 lg:px-6">

          {/* Title & Actions Row */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                Kırmızı Perde
              </h1>
              <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                {activeTab === 'discover' 
                  ? 'Dünya trendleri & popüler yapımlar' 
                  : (loading ? 'Yükleniyor...' : `${filteredItems.length} kayıt`)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {activeTab === 'lists' && (
                <>
                  {/* Reorder toggle */}
                  {customLists.length > 1 && (
                    <button
                      onClick={() => setReorderMode(v => !v)}
                      className={`flex items-center justify-center h-8 sm:h-9 px-2 sm:px-3 rounded-xl transition-all haptic-tap cursor-pointer shrink-0 ${reorderMode ? 'ring-2 ring-accent' : ''}`}
                      style={{
                        background: reorderMode ? 'hsla(var(--accent-h),var(--accent-s),var(--accent-l),0.18)' : 'var(--bg-secondary)',
                        color: reorderMode ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                      title={reorderMode ? "Sıralamayı Tamamla" : "Listeleri Sırala & Yönet"}
                    >
                      <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                      </svg>
                      <span className="hidden sm:inline text-xs font-bold ml-1.5">
                        {reorderMode ? 'Bitti' : 'Sırala'}
                      </span>
                    </button>
                  )}
                  {/* New List */}
                  <button
                    onClick={() => setIsCreateListModalOpen(true)}
                    className="flex items-center justify-center h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-colors haptic-tap cursor-pointer shrink-0"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                    title="Yeni Liste Oluştur"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.06-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                    <span className="text-xs font-bold ml-1">Liste</span>
                  </button>
                </>
              )}
              {/* Add */}
              <Link
                href="/watchlist/add"
                className="flex items-center justify-center h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl transition-colors haptic-tap cursor-pointer shrink-0"
                style={{ background: 'hsla(var(--accent-h),var(--accent-s),var(--accent-l),0.12)', color: 'var(--accent)' }}
                title="Film veya Dizi Ekle"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="font-bold text-xs ml-1">Ekle</span>
              </Link>
            </div>
          </div>

          {/* Row 2: Tabs & Search (Compact) */}
          {isMobileSearchOpen ? (
            <div className="flex items-center gap-2 pt-0.5 animate-[fadeIn_0.15s_ease-out]">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <input
                  type="text"
                  autoFocus
                  placeholder="Kütüphanemde ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 rounded-xl text-xs sm:text-sm font-medium outline-none themed-input"
                  style={{ color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-1 px-1.5 flex items-center haptic-tap cursor-pointer"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </button>
                ) : null}
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsMobileSearchOpen(false);
                }}
                className="px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all haptic-tap cursor-pointer shrink-0"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                Kapat
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 pt-0.5">
              {/* Segmented Control Tabs */}
              <div className="flex items-center p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-black/5 dark:border-white/10 shrink-0" style={{ background: 'var(--bg-secondary)' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('lists')}
                  className={`flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all haptic-tap cursor-pointer ${
                    activeTab === 'lists'
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                  <span>Listelerim</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('discover')}
                  className={`flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all haptic-tap cursor-pointer ${
                    activeTab === 'discover'
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                  </svg>
                  <span className="sm:hidden">Keşfet</span>
                  <span className="hidden sm:inline">Keşfet ve Trendler</span>
                </button>
              </div>

              {/* Search on lists tab */}
              {activeTab === 'lists' && (
                <div className="flex items-center gap-2">
                  {/* Mobile Search Toggle Button */}
                  <button
                    onClick={() => setIsMobileSearchOpen(true)}
                    className="sm:hidden flex items-center justify-center w-8 h-8 rounded-xl transition-all haptic-tap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                    title="Ara"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </button>

                  {/* Desktop Search Input */}
                  <div className="hidden sm:block relative w-56 md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Kütüphanemde ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 rounded-xl text-xs font-medium outline-none themed-input"
                      style={{ color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-1 px-1.5 flex items-center haptic-tap cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <div className="w-3.5 h-3.5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </header>

      {/* ─── CONTENT ─── */}
      <main className="py-2 lg:py-4">
        {activeTab === 'discover' ? (
          <div>
            <DiscoverView
              cardWidthClass={cardWidthClass}
              onOpenItemModal={(id) => router.push(`/watchlist?v=${id}`)}
            />
          </div>
        ) : (
          (() => {
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
                        <div className="flex items-center justify-center gap-1 shrink-0 bg-black/5 dark:bg-white/10 p-1 rounded-xl">
                          <button
                            onClick={() => reorderCustomLists(sectionIndex, sectionIndex - 1)}
                            disabled={sectionIndex === 0}
                            className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-20 hover:opacity-100 transition-all haptic-tap cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                            style={{ color: 'var(--text-secondary)' }}
                            title="Yukarı Taşı"
                          >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                          </button>
                          <button
                            onClick={() => reorderCustomLists(sectionIndex, sectionIndex + 1)}
                            disabled={sectionIndex === customLists.length - 1}
                            className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-20 hover:opacity-100 transition-all haptic-tap cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                            style={{ color: 'var(--text-secondary)' }}
                            title="Aşağı Taşı"
                          >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                        </div>
                      )}

                      <h2 className="text-sm font-bold tracking-widest uppercase flex items-center gap-1.5 truncate" style={{ color: 'var(--text-primary)' }}>
                        <span className="truncate">{title}</span>
                        {!reorderMode && (
                          <svg className="w-3.5 h-3.5 opacity-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </h2>
                      <span className="text-[10px] opacity-50 font-medium shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                        {groupItems.length}
                      </span>

                      {groupItems.length > 0 && !reorderMode && (
                        <Link 
                          href={`/watchlist/list?id=${customListId || 'unlisted'}`}
                          className="ml-auto sm:ml-3 px-2.5 py-1 rounded-md text-xs font-bold transition-colors haptic-tap cursor-pointer shrink-0"
                          style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}
                        >
                          Tümünü Gör
                        </Link>
                      )}

                      {/* Custom list actions - ONLY active when reorderMode is enabled */}
                      {customListId && reorderMode && (
                        <div className="ml-auto flex items-center gap-1 shrink-0">
                          <button
                            onClick={async () => {
                              const newName = await prompt('Listenin yeni adı:', title);
                              if (newName?.trim()) editCustomList(customListId, newName.trim());
                            }}
                            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors haptic-tap cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                            style={{ color: 'var(--text-secondary)' }}
                            title="Listeyi Yeniden Adlandır"
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
                            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors haptic-tap cursor-pointer hover:bg-red-500/10 hover:text-red-500"
                            style={{ color: 'var(--text-secondary)' }}
                            title="Listeyi Sil"
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
                          className="ml-2 px-3 py-1 rounded-lg text-xs font-bold transition-colors haptic-tap cursor-pointer shrink-0"
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
                  {/* Hero Billboard for user's collection */}
                  {heroItem && (
                    <div className="px-4 lg:px-6">
                      <HeroBillboard
                        item={heroItem}
                        onNext={eligibleHeroItems.length > 1 ? handleNextHero : undefined}
                        onOpenDetails={(id) => router.push(`/watchlist?v=${id}`)}
                      />
                    </div>
                  )}

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
                    ? 'Henüz hiç film veya dizi eklemediniz. "Keşfet & Trendler" sekmesinden popüler içerikleri tek tıkla ekleyebilirsiniz!'
                    : 'Arama veya filtre kriterlerinize uygun kayıt bulunamadı.'}
                />
                {items.length === 0 && (
                  <div className="mt-4 flex justify-center gap-3">
                    <button 
                      onClick={() => setActiveTab('discover')} 
                      className="btn-accent px-5 py-2.5 rounded-xl font-semibold text-sm haptic-tap cursor-pointer inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                      </svg>
                      <span>Trendleri Keşfet</span>
                    </button>
                    <Link href="/watchlist/add" className="px-5 py-2.5 rounded-xl font-medium text-sm haptic-tap cursor-pointer inline-flex items-center gap-2" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      Manuel Ekle
                    </Link>
                  </div>
                )}
              </div>
            );
          })()
        )}

        {/* Floating Filter & Sort Control (Only in lists view) */}
        {activeTab === 'lists' && (
          <FloatingFilterSort
            sortOptions={[
              { key: 'date-desc', label: 'En Yeni' },
              { key: 'date-asc', label: 'En Eski' },
              { key: 'title-asc', label: 'A → Z' },
              { key: 'title-desc', label: 'Z → A' },
              { key: 'rating-desc', label: 'Puan' },
              { key: 'duration-desc', label: 'Süre (Uzun)' },
              { key: 'duration-asc', label: 'Süre (Kısa)' },
            ]}
            currentSort={sortBy}
            onSelectSort={(val) => setSortBy(val as typeof sortBy)}
            onOpenFilter={() => setIsFilterOpen(true)}
            hasActiveFilters={statusFilter !== 'all' || typeFilter !== 'all'}
          />
        )}

      </main>

      {/* ─── MODALS ─── */}
      
      {/* Filter Modal Content */}
      <div className="hidden lg:block">
        <Modal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filtreler ve Sıralama">
          <div className="flex flex-col gap-6 w-full pb-4">
            
            {/* Status Filters */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">İzleme Durumu</label>
              <div className="flex flex-wrap items-center gap-2">
                {/* All */}
                <button
                  onClick={() => { setStatusFilter('all'); }}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-300 haptic-tap cursor-pointer shrink-0 border ${
                    statusFilter === 'all' && typeFilter === 'all' ? 'border-transparent shadow-sm' : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{
                    background: statusFilter === 'all' && typeFilter === 'all' ? 'var(--accent)' : 'transparent',
                    color: statusFilter === 'all' && typeFilter === 'all' ? 'var(--accent-foreground, white)' : 'var(--text-secondary)',
                  }}
                >
                  <svg className={`w-4 h-4 ${statusFilter === 'all' && typeFilter === 'all' ? 'opacity-100' : 'opacity-60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                      onClick={() => { setStatusFilter(isActive ? 'all' : key); }}
                      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-300 haptic-tap cursor-pointer shrink-0 border ${
                        isActive ? 'border-transparent shadow-sm' : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      style={{
                        background: isActive ? 'var(--accent)' : 'transparent',
                        color: isActive ? 'var(--accent-foreground, white)' : 'var(--text-secondary)',
                      }}
                    >
                      <div className={isActive ? 'opacity-100' : 'opacity-60'}>
                        <WatchStatusIcon icon={info.icon} className="w-4 h-4" />
                      </div>
                      {info.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Type Filters */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Tür</label>
              <div className="flex flex-wrap items-center gap-2">
                {/* All Type */}
                <button
                  onClick={() => { setTypeFilter('all'); }}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-300 haptic-tap cursor-pointer shrink-0 border ${
                    typeFilter === 'all' ? 'border-transparent shadow-sm' : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{
                    background: typeFilter === 'all' ? 'var(--accent)' : 'transparent',
                    color: typeFilter === 'all' ? 'var(--accent-foreground, white)' : 'var(--text-secondary)',
                  }}
                >
                  <svg className={`w-4 h-4 ${typeFilter === 'all' ? 'opacity-100' : 'opacity-60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />
                  </svg>
                  Tümü
                </button>

                {(Object.entries(WATCH_TYPE_INFO) as [WatchItemType, { label: string; icon: string }][]).map(([key, info]) => {
                  const isActive = typeFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { setTypeFilter(isActive ? 'all' : key); }}
                      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-300 haptic-tap cursor-pointer shrink-0 border ${
                        isActive ? 'border-transparent shadow-sm' : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      style={{
                        background: isActive ? 'var(--accent)' : 'transparent',
                        color: isActive ? 'var(--accent-foreground, white)' : 'var(--text-secondary)',
                      }}
                    >
                      <div className={isActive ? 'opacity-100' : 'opacity-60'}>
                        <WatchStatusIcon icon={info.icon} className="w-4 h-4" />
                      </div>
                      {info.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Sıralama</label>
              <div className="relative flex items-center border rounded-xl haptic-tap cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 shrink-0 border-black/10 dark:border-white/10 w-max">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="appearance-none inline-flex items-center justify-center gap-1.5 pl-3.5 pr-8 py-2 text-sm font-bold bg-transparent cursor-pointer outline-none shrink-0"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {Object.entries(sortLabels).map(([key, label]) => (
                    <option key={key} value={key} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{label}</option>
                  ))}
                </select>
                <svg className="w-4 h-4 absolute right-2.5 pointer-events-none opacity-60" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>

          </div>
        </Modal>
      </div>

      <div className="lg:hidden">
        <BottomSheet isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filtreler ve Sıralama">
          <div className="flex flex-col gap-6 w-full">
            
            {/* Status Filters */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">İzleme Durumu</label>
              <div className="flex flex-wrap items-center gap-2">
                {/* All */}
                <button
                  onClick={() => { setStatusFilter('all'); }}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-300 haptic-tap cursor-pointer shrink-0 border ${
                    statusFilter === 'all' && typeFilter === 'all' ? 'border-transparent shadow-sm' : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{
                    background: statusFilter === 'all' && typeFilter === 'all' ? 'var(--accent)' : 'transparent',
                    color: statusFilter === 'all' && typeFilter === 'all' ? 'var(--accent-foreground, white)' : 'var(--text-secondary)',
                  }}
                >
                  <svg className={`w-4 h-4 ${statusFilter === 'all' && typeFilter === 'all' ? 'opacity-100' : 'opacity-60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                      onClick={() => { setStatusFilter(isActive ? 'all' : key); }}
                      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-300 haptic-tap cursor-pointer shrink-0 border ${
                        isActive ? 'border-transparent shadow-sm' : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      style={{
                        background: isActive ? 'var(--accent)' : 'transparent',
                        color: isActive ? 'var(--accent-foreground, white)' : 'var(--text-secondary)',
                      }}
                    >
                      <div className={isActive ? 'opacity-100' : 'opacity-60'}>
                        <WatchStatusIcon icon={info.icon} className="w-4 h-4" />
                      </div>
                      {info.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Type Filters */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Tür</label>
              <div className="flex flex-wrap items-center gap-2">
                {/* All Type */}
                <button
                  onClick={() => { setTypeFilter('all'); }}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-300 haptic-tap cursor-pointer shrink-0 border ${
                    typeFilter === 'all' ? 'border-transparent shadow-sm' : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{
                    background: typeFilter === 'all' ? 'var(--accent)' : 'transparent',
                    color: typeFilter === 'all' ? 'var(--accent-foreground, white)' : 'var(--text-secondary)',
                  }}
                >
                  <svg className={`w-4 h-4 ${typeFilter === 'all' ? 'opacity-100' : 'opacity-60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />
                  </svg>
                  Tümü
                </button>

                {(Object.entries(WATCH_TYPE_INFO) as [WatchItemType, { label: string; icon: string }][]).map(([key, info]) => {
                  const isActive = typeFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { setTypeFilter(isActive ? 'all' : key); }}
                      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-300 haptic-tap cursor-pointer shrink-0 border ${
                        isActive ? 'border-transparent shadow-sm' : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      style={{
                        background: isActive ? 'var(--accent)' : 'transparent',
                        color: isActive ? 'var(--accent-foreground, white)' : 'var(--text-secondary)',
                      }}
                    >
                      <div className={isActive ? 'opacity-100' : 'opacity-60'}>
                        <WatchStatusIcon icon={info.icon} className="w-4 h-4" />
                      </div>
                      {info.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Sıralama</label>
              <div className="relative flex items-center border rounded-xl haptic-tap cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 shrink-0 border-black/10 dark:border-white/10 w-max">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="appearance-none inline-flex items-center justify-center gap-1.5 pl-3.5 pr-8 py-2 text-sm font-bold bg-transparent cursor-pointer outline-none shrink-0"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {Object.entries(sortLabels).map(([key, label]) => (
                    <option key={key} value={key} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{label}</option>
                  ))}
                </select>
                <svg className="w-4 h-4 absolute right-2.5 pointer-events-none opacity-60" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>

          </div>
        </BottomSheet>
      </div>

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
