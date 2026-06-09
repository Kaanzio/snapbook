'use client';

import { useWatchlist } from '@/hooks/useWatchlist';
import WatchCard from '@/components/watchlist/WatchCard';
import Link from 'next/link';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePreferences } from '@/components/providers/PreferencesProvider';
import WatchItemModal from '@/components/watchlist/WatchItemModal';
import { useRouter, useSearchParams } from 'next/navigation';

function ListContent() {
  const { items, customLists, loading } = useWatchlist();
  const { prefs } = usePreferences();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const viewId = searchParams.get('v');

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
  let listItems = [];

  if (id === 'unlisted') {
    listName = 'Listesiz';
    listItems = items.filter(item => !item.listIds || item.listIds.length === 0);
  } else {
    const customList = customLists.find(l => l.id === id);
    if (!customList) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center page-enter">
          <h1 className="text-2xl font-bold mb-4">Liste Bulunamadı</h1>
          <Link href="/watchlist" className="text-accent hover:underline font-medium">Geri Dön</Link>
        </div>
      );
    }
    listName = customList.name;
    listItems = items.filter(item => item.listIds?.includes(id));
  }

  return (
    <div className="min-h-screen page-enter pb-24">
      <header className="sticky top-0 z-30 themed-header shadow-sm">
        <div className="px-4 lg:px-6 py-4 flex items-center gap-3">
          <Link href="/watchlist" className="p-2 rounded-xl transition-colors haptic-tap" style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {listName}
            </h1>
            <p className="text-xs font-medium opacity-60 mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {listItems.length} kayıt
            </p>
          </div>
        </div>
      </header>

      <main className="py-6 px-4 lg:px-6">
        {listItems.length === 0 ? (
          <div className="flex items-center justify-center py-12 rounded-2xl border-dashed border text-sm font-medium" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-tertiary)' }}>
            Bu liste henüz boş
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 sm:gap-4 lg:gap-5">
            <AnimatePresence>
              {listItems.map(item => (
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

      {/* ─── MODALS ─── */}
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
