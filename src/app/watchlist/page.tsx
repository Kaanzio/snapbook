'use client';

import { useState, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWatchlist } from '@/hooks/useWatchlist';
import { usePreferences } from '@/components/providers/PreferencesProvider';
import WatchCard from '@/components/watchlist/WatchCard';
import EmptyState from '@/components/ui/EmptyState';
import { WatchStatus, WatchItemType, WATCH_STATUS_INFO, WATCH_TYPE_INFO } from '@/types';
import WatchItemModal from '@/components/watchlist/WatchItemModal';
import CreateListModal from '@/components/watchlist/CreateListModal';
import { useDialog } from '@/components/providers/DialogProvider';
import { WatchStatusIcon } from '@/components/watchlist/WatchIcons';

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
      <header className="sticky top-0 z-30 themed-header shadow-sm">
        <div className="px-4 lg:px-6 py-6">

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

          {/* ── Search Bar ── */}
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Film, dizi, etiket ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl text-sm themed-input"
              style={{ fontSize: '15px' }}
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center haptic-tap"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>

          {/* ── Filter Row ── */}
          <div className="flex items-center gap-2">
            {/* Status chips */}
            <div className="flex-1 flex gap-1.5 overflow-x-auto hide-scrollbar">
              {/* All */}
              <button
                onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all haptic-tap ${statusFilter === 'all' && typeFilter === 'all' ? 'text-accent' : ''}`}
                style={{
                  background: statusFilter === 'all' && typeFilter === 'all'
                    ? 'hsla(var(--accent-h),var(--accent-s),var(--accent-l),0.15)'
                    : 'var(--bg-secondary)',
                  color: statusFilter === 'all' && typeFilter === 'all' ? 'var(--accent)' : 'var(--text-tertiary)',
                  border: statusFilter === 'all' && typeFilter === 'all' ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                }}
              >
                Tümü
              </button>

              {/* Status filters */}
              {(Object.entries(WATCH_STATUS_INFO) as [WatchStatus, { label: string; icon: string; color: string }][]).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => { setStatusFilter(statusFilter === key ? 'all' : key); setTypeFilter('all'); }}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all haptic-tap"
                  style={{
                    background: statusFilter === key ? 'hsla(var(--accent-h),var(--accent-s),var(--accent-l),0.15)' : 'var(--bg-secondary)',
                    color: statusFilter === key ? 'var(--accent)' : 'var(--text-tertiary)',
                    border: statusFilter === key ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                  }}
                >
                  <WatchStatusIcon icon={info.icon} className="w-3 h-3" />
                  {info.label}
                </button>
              ))}

              {/* Type divider + type filters */}
              <div className="w-px shrink-0 self-stretch" style={{ background: 'var(--border-primary)', margin: '4px 2px' }} />
              {(Object.entries(WATCH_TYPE_INFO) as [WatchItemType, { label: string; icon: string }][]).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => { setTypeFilter(typeFilter === key ? 'all' : key); setStatusFilter('all'); }}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all haptic-tap"
                  style={{
                    background: typeFilter === key ? 'hsla(var(--accent-h),var(--accent-s),var(--accent-l),0.15)' : 'var(--bg-secondary)',
                    color: typeFilter === key ? 'var(--accent)' : 'var(--text-tertiary)',
                    border: typeFilter === key ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                  }}
                >
                  <WatchStatusIcon icon={info.icon} className="w-3 h-3" />
                  {info.label}
                </button>
              ))}
            </div>

            {/* Sort button */}
            <div ref={sortMenuRef} className="relative shrink-0">
              <button
                onClick={() => setShowSortMenu(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all haptic-tap"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1.5px solid transparent',
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                </svg>
                {sortLabels[sortBy]}
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                  <div
                    className="absolute right-0 top-full mt-1.5 w-44 p-1.5 rounded-2xl shadow-2xl z-50 animate-[slideDown_0.15s_ease-out]"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
                  >
                    {Object.entries(sortLabels).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => { setSortBy(key as typeof sortBy); setShowSortMenu(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors haptic-tap flex items-center justify-between"
                        style={{
                          background: sortBy === key ? 'hsla(var(--accent-h),var(--accent-s),var(--accent-l),0.12)' : 'transparent',
                          color: sortBy === key ? 'var(--accent)' : 'var(--text-primary)',
                        }}
                      >
                        <span className="font-medium">{label}</span>
                        {sortBy === key && (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
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

          if (displayItems.length > 0) {
            // Search grid
            if (searchQuery.trim() !== '') {
              return (
                <div className="mt-4">
                  <div className="px-4 lg:px-6 mb-4 flex items-baseline gap-3">
                    <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-primary)' }}>Sonuçlar</h2>
                    <span className="text-xs opacity-60" style={{ color: 'var(--text-tertiary)' }}>{displayItems.length} kayıt</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 lg:gap-5 px-4 lg:px-6">
                    {displayItems.map(item => (
                      <div key={item.id} className="w-full">
                        <WatchCard item={item} />
                      </div>
                    ))}
                  </div>
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

                    {/* Custom list actions */}
                    {customListId && !reorderMode && (
                      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/list:opacity-100 transition-opacity">
                        <button
                          onClick={async () => {
                            const newName = await prompt('Listenin yeni adı:', title);
                            if (newName?.trim()) editCustomList(customListId, newName.trim());
                          }}
                          className="p-1.5 rounded-lg transition-colors haptic-tap"
                          style={{ color: 'var(--text-tertiary)' }}
                          title="Düzenle"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                          className="p-1.5 rounded-lg transition-colors haptic-tap"
                          style={{ color: 'var(--text-tertiary)' }}
                          title="Sil"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                    <div className="flex overflow-x-auto hide-scrollbar gap-3 lg:gap-4 px-4 lg:px-6 snap-x snap-mandatory pb-4">
                      {groupItems.map(item => (
                        <div key={item.id} className={`snap-start shrink-0 ${cardWidthClass}`}>
                          <WatchCard item={item} />
                        </div>
                      ))}
                    </div>
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
                    return renderSection('Listesiz', unlistedItems, 'unlisted', customLists.length);
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

      {/* ─── FAB ─── */}
      <Link
        href="/watchlist/add"
        className="fixed bottom-20 right-4 lg:right-8 lg:bottom-8 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white z-40 transition-all hover:scale-110 haptic-tap lg:hidden"
        style={{ background: 'var(--accent)' }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </Link>

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
