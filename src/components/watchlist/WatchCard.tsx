'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WatchItem, WATCH_TYPE_INFO } from '@/types';
import { usePhotoImage } from '@/hooks/usePhotoImage';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useDialog } from '@/components/providers/DialogProvider';

interface WatchCardProps {
  item: WatchItem;
}

export default function WatchCard({ item }: WatchCardProps) {
  const { imageUrl, loading } = usePhotoImage(`watch-poster-${item.id}`);
  const { removeItem, customLists, toggleItemInList } = useWatchlist();
  const { confirm } = useDialog();
  const [menuOpen, setMenuOpen] = useState(false);
  const [listsSubmenu, setListsSubmenu] = useState(false);
  
  const typeInfo = WATCH_TYPE_INFO[item.type];
  
  // Yıl ve ek bilgi metni oluştur
  const year = new Date(item.created_at).getFullYear();
  let infoText = `${year}`;
  if (item.type === 'series' && item.currentSeason) {
    infoText += ` • ${item.currentSeason}. Sezon`;
  } else if (item.rating) {
    infoText += ` • ⭐ ${item.rating}`;
  }

  return (
    <div className="flex flex-col w-full h-full group relative shrink-0">
      <div 
        className="block relative rounded-xl overflow-hidden aspect-[2/3] transition-transform duration-300"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <Link href={`?v=${item.id}`} className="absolute inset-0 z-10 haptic-tap" />
        {/* Poster Image */}
        {loading ? (
          <div className="absolute inset-0 skeleton" />
        ) : imageUrl ? (
          <img 
            src={imageUrl} 
            alt={item.title} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <span className="text-4xl mb-2 opacity-50">{typeInfo.icon}</span>
            <span className="text-xs font-medium opacity-50" style={{ color: 'var(--text-tertiary)' }}>Afiş Yok</span>
          </div>
        )}
        
        {/* Top Gradient for 3-dot menu visibility */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* 3-dot Menu */}
      <button 
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70 backdrop-blur-md pointer-events-auto z-20"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen(!menuOpen);
          setListsSubmenu(false);
        }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); }} />
          <div 
            className="absolute top-11 right-0 w-48 bg-[#2b2b2b] rounded-xl shadow-2xl z-40 p-2 border border-white/10 text-white animate-[fadeIn_0.15s_ease-out] origin-top-right"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {!listsSubmenu ? (
              <>
                <Link href={`/watchlist/edit?id=${item.id}`} className="block px-3 py-2.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors">
                  Düzenle
                </Link>
                <button 
                  onClick={() => setListsSubmenu(true)} 
                  className="w-full text-left px-3 py-2.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors flex items-center justify-between"
                >
                  Listeye Ekle
                  <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
                <button 
                  onClick={async () => {
                    if(await confirm('Silmek istediğinize emin misiniz?')) {
                      removeItem(item.id);
                    }
                    setMenuOpen(false);
                  }} 
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  Sil
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setListsSubmenu(false)} className="w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider opacity-60 mb-1 flex items-center gap-1 hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  Geri
                </button>
                <div className="max-h-48 overflow-y-auto hide-scrollbar space-y-1">
                  {customLists.length === 0 ? (
                    <div className="px-3 py-3 text-xs opacity-50 text-center italic">Henüz özel liste yok</div>
                  ) : (
                    customLists.map(list => {
                      const isInList = item.listIds?.includes(list.id);
                      return (
                        <button 
                          key={list.id} 
                          onClick={() => toggleItemInList(item.id, list.id)} 
                          className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 rounded-lg flex items-center justify-between transition-colors"
                        >
                          <span className="truncate pr-2">{list.name}</span>
                          {isInList && <span className="text-green-500 font-bold shrink-0">✓</span>}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Info Below Poster */}
      <div className="mt-2.5 flex flex-col px-1">
        <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
          {item.title}
        </h3>
        <span className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {infoText}
        </span>
      </div>
    </div>
  );
}
