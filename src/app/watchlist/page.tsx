'use client';

import { useState, Suspense } from 'react';
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

function WatchlistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewId = searchParams.get('v');
  const { items, customLists, loading, getFilteredItems, addCustomList, editCustomList, removeCustomList } = useWatchlist();
  const { prefs } = usePreferences();
  const { confirm, prompt } = useDialog();
  
  const [statusFilter, setStatusFilter] = useState<WatchStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<WatchItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'rating-desc'>('date-desc');
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);

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
      default: return 0;
    }
  });

  const statuses: { value: WatchStatus | 'all', label: string }[] = [
    { value: 'all', label: 'Tümü' },
    ...Object.entries(WATCH_STATUS_INFO).map(([k, v]) => ({ value: k as WatchStatus, label: v.label }))
  ];

  const types: { value: WatchItemType | 'all', label: string }[] = [
    { value: 'all', label: 'Tümü' },
    ...Object.entries(WATCH_TYPE_INFO).map(([k, v]) => ({ value: k as WatchItemType, label: v.label }))
  ];

  return (
    <div className="min-h-screen page-enter pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 themed-header shadow-sm">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>İzleme Listesi</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {loading ? 'Yükleniyor...' : `${filteredItems.length} kayıt`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsCreateListModalOpen(true)}
                className="px-3 py-2 rounded-xl text-sm font-bold bg-[var(--bg-secondary)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors haptic-tap flex items-center gap-1.5"
                title="Yeni Özel Liste Oluştur"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Liste
              </button>
              <Link 
                href="/watchlist/add"
                className="p-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors haptic-tap flex items-center"
                title="Film veya Dizi Ekle"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Film veya dizi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-xl text-sm themed-input"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors haptic-tap"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sort & Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-3 pr-8 py-1.5 rounded-lg text-xs font-medium themed-input appearance-none bg-no-repeat w-auto haptic-tap"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1em'
                }}
              >
                <option value="date-desc">En Yeni Eklenenler</option>
                <option value="date-asc">En Eski Eklenenler</option>
                <option value="title-asc">İsme Göre (A-Z)</option>
                <option value="title-desc">İsme Göre (Z-A)</option>
                <option value="rating-desc">En Yüksek Puanlılar</option>
              </select>
            </div>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {statuses.map(status => (
                <button
                  key={status.value}
                  onClick={() => setStatusFilter(status.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors haptic-tap border
                    ${statusFilter === status.value 
                      ? 'bg-accent text-accent-foreground border-accent' 
                      : 'border-transparent'}`}
                  style={{ 
                    background: statusFilter !== status.value ? 'var(--bg-secondary)' : undefined,
                    color: statusFilter !== status.value ? 'var(--text-secondary)' : undefined
                  }}
                >
                  {status.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {types.map(type => (
                <button
                  key={type.value}
                  onClick={() => setTypeFilter(type.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors haptic-tap border
                    ${typeFilter === type.value 
                      ? 'bg-accent text-accent-foreground border-accent' 
                      : 'border-transparent'}`}
                  style={{ 
                    background: typeFilter !== type.value ? 'var(--bg-secondary)' : undefined,
                    color: typeFilter !== type.value ? 'var(--text-secondary)' : undefined
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-2 lg:py-4">
        {(() => {
          let cardWidthClass = "w-32 sm:w-40 md:w-48 lg:w-56";
          if (prefs.gridDensity === 'compact') {
            cardWidthClass = "w-28 sm:w-32 md:w-40 lg:w-48";
          } else if (prefs.gridDensity === 'large') {
            cardWidthClass = "w-40 sm:w-48 md:w-56 lg:w-64";
          }

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
            // Eğer arama yapılıyorsa satırlar yerine Izgara (Grid) göster
            if (searchQuery.trim() !== '') {
              return (
                <div className="mt-4">
                  <div className="px-4 lg:px-6 mb-4 flex items-baseline gap-3">
                    <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-primary)' }}>
                      Arama Sonuçları
                    </h2>
                    <span className="text-xs opacity-60 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                      {displayItems.length} kayıt bulundu
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4 px-4 lg:px-6">
                    {displayItems.map(item => (
                      <div key={item.id} className="w-full">
                        <WatchCard item={item} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            const renderSection = (title: string, groupItems: typeof displayItems, customListId?: string) => {
              if (groupItems.length === 0 && !customListId) return null;
              return (
                <div className="mb-8 relative group/list">
                  <div className="flex items-center px-4 lg:px-6 mb-3">
                    <h2 className="text-sm font-bold tracking-widest uppercase flex items-center" style={{ color: 'var(--text-primary)' }}>
                      {title}
                      <svg className="w-4 h-4 ml-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </h2>
                    <span className="text-[10px] ml-3 opacity-60 font-medium" style={{ color: 'var(--text-tertiary)' }}>{groupItems.length} KAYIT</span>
                    
                    {customListId && (
                      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/list:opacity-100 transition-opacity">
                        <button 
                          onClick={async () => {
                            const newName = await prompt('Listenin yeni adı:', title);
                            if (newName && newName.trim()) editCustomList(customListId, newName.trim());
                          }}
                          className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:bg-white/10 hover:text-white transition-colors haptic-tap"
                          title="Listeyi Düzenle"
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
                          className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:bg-red-500/10 hover:text-red-500 transition-colors haptic-tap"
                          title="Listeyi Sil"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Horizontal scroll container */}
                  {groupItems.length === 0 ? (
                    <div className="px-4 lg:px-6 pb-4">
                      <div className="w-full flex items-center justify-center py-6 rounded-2xl border border-dashed text-sm font-medium transition-colors" style={{ borderColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
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
                {/* Sadece Özel Listeler (Satırlar halinde) */}
                {customLists && customLists.map(list => {
                  const listItems = displayItems.filter(item => item.listIds?.includes(list.id));
                  return <div key={list.id}>{renderSection(list.name, listItems, list.id)}</div>;
                })}
              </div>
            );
          }

          return (
            <div className="mt-12 px-4">
              <EmptyState
                icon="🎬"
                title={items.length === 0 ? "Listeniz boş" : "Sonuç bulunamadı"}
                description={items.length === 0 
                  ? "Henüz hiç film veya dizi eklemediniz." 
                  : "Arama kriterlerinize uyan kayıt bulunamadı."}
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

      {/* Floating Action Button */}
      <Link 
        href="/watchlist/add"
        className="fixed bottom-20 right-4 lg:right-8 lg:bottom-8 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white z-40 transition-transform hover:scale-110 haptic-tap"
        style={{ background: 'var(--accent)' }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </Link>
      {/* Modals */}
      {viewId && (
        <WatchItemModal id={viewId} onClose={() => router.push('/watchlist')} />
      )}
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
      <WatchlistContent />
    </Suspense>
  );
}
