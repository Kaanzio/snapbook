'use client';

import { useState } from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';
import WatchCard from '@/components/watchlist/WatchCard';
import Link from 'next/link';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePreferences } from '@/components/providers/PreferencesProvider';
import { useDialog } from '@/components/providers/DialogProvider';
import WatchItemModal from '@/components/watchlist/WatchItemModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { WatchStatus, WatchItemType, WATCH_STATUS_INFO, WATCH_TYPE_INFO } from '@/types';
import Modal from '@/components/ui/Modal';
import BottomSheet from '@/components/ui/BottomSheet';
import { WatchStatusIcon } from '@/components/watchlist/WatchIcons';

function ListContent() {
  const { items, customLists, loading, getFilteredItems, editCustomList, removeCustomList } = useWatchlist();
  const { prefs } = usePreferences();
  const { confirm, prompt } = useDialog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const viewId = searchParams.get('v');

  const [statusFilter, setStatusFilter] = useState<WatchStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<WatchItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'rating-desc' | 'duration-desc' | 'duration-asc'>('date-desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>;
  }

  if (!id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center page-enter">
        <h1 className="text-2xl font-bold mb-4">Liste Seçilmedi</h1>
        <Link href="/watchlist" className="text-accent hover:underline font-medium">Geri Dön</Link>
      </div>
    );
  }

  let listName = '';
  let listExists = true;

  if (id === 'unlisted') {
    listName = 'Listesiz';
  } else {
    const customList = customLists.find(l => l.id === id);
    if (!customList) {
      listExists = false;
    } else {
      listName = customList.name;
    }
  }

  if (!listExists) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center page-enter">
        <h1 className="text-2xl font-bold mb-4">Liste Bulunamadı</h1>
        <Link href="/watchlist" className="text-accent hover:underline font-medium">Geri Dön</Link>
      </div>
    );
  }

  const filteredBaseItems = getFilteredItems({
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    searchQuery: searchQuery.trim() || undefined,
  });

  let filteredListItems = [];
  if (id === 'unlisted') {
    filteredListItems = filteredBaseItems.filter(item => !item.listIds || item.listIds.length === 0);
  } else {
    filteredListItems = filteredBaseItems.filter(item => item.listIds?.includes(id));
  }

  const displayItems = [...filteredListItems].sort((a, b) => {
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

  let cardWidthClass = 'w-40 sm:w-48 md:w-56 lg:w-64';
  if (prefs.gridDensity === 'compact') cardWidthClass = 'w-36 sm:w-40 md:w-48 lg:w-56';
  else if (prefs.gridDensity === 'large') cardWidthClass = 'w-48 sm:w-56 md:w-64 lg:w-80';

  const filterContent = (
    <div className="flex flex-col gap-6 w-full pb-4">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">İzleme Durumu</label>
        <div className="flex flex-wrap items-center gap-2">
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
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Tür</label>
        <div className="flex flex-wrap items-center gap-2">
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
  );

  return (
    <div className="min-h-screen page-enter pb-24">
      <header className="sticky top-0 z-30 themed-header shadow-sm pt-8 lg:pt-6 pb-2 lg:pb-3">
        <div className="px-4 lg:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/watchlist" className="p-2 rounded-xl transition-colors haptic-tap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                {listName}
              </h1>
              <p className="text-xs font-medium opacity-60 mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {displayItems.length} kayıt
              </p>
            </div>
          </div>
          
          {id !== 'unlisted' && (
            <div className="flex items-center gap-1 transition-opacity opacity-40 hover:opacity-100 shrink-0">
              <button
                onClick={async () => {
                  const newName = await prompt('Listenin yeni adı:', listName);
                  if (newName?.trim()) editCustomList(id, newName.trim());
                }}
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-xl transition-colors haptic-tap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--text-tertiary)' }}
                title="Düzenle"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.89l12.685-12.685z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.862 4.487" />
                </svg>
              </button>
              <button
                onClick={async () => {
                  if (await confirm(`"${listName}" listesini silmek istediğinize emin misiniz?`)) {
                    await removeCustomList(id);
                    router.push('/watchlist');
                  }
                }}
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-xl transition-colors haptic-tap cursor-pointer hover:bg-red-500/10 hover:text-red-500"
                style={{ color: 'var(--text-tertiary)' }}
                title="Sil"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="px-4 lg:px-6 flex items-center w-full mt-4">
          <div className="relative group shrink-0 w-full sm:w-80 max-w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-accent z-10" style={{ color: 'var(--text-tertiary)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Liste içinde ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-xl text-sm font-medium outline-none transition-all duration-300 themed-input"
              style={{ color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
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
        </div>
      </header>

      <main className="py-6 px-4 lg:px-6">
        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-dashed border text-sm font-medium gap-2" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-tertiary)' }}>
            <svg className="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span>{searchQuery ? 'Arama sonucu bulunamadı' : 'Bu liste henüz boş'}</span>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 sm:gap-4 lg:gap-5">
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
        )}
      </main>

      <button
        onClick={() => setIsFilterOpen(true)}
        className="fixed bottom-20 lg:bottom-8 right-6 z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 haptic-tap cursor-pointer"
        style={{ background: 'var(--accent)', color: 'var(--accent-foreground, white)' }}
        title="Filtreler"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
        </svg>
        {(statusFilter !== 'all' || typeFilter !== 'all') && (
          <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-red-500 border-2" style={{ borderColor: 'var(--bg-primary)' }} />
        )}
      </button>

      <div className="hidden lg:block">
        <Modal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filtreler ve Sıralama">
          {filterContent}
        </Modal>
      </div>

      <BottomSheet isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filtreler ve Sıralama">
        {filterContent}
      </BottomSheet>

      {viewId && <WatchItemModal id={viewId} onClose={() => router.push(`/watchlist/list?id=${id}`)} />}
    </div>
  );
}

export default function ListPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>}>
      <ListContent />
    </Suspense>
  );
}
