'use client';

import { PhotoMetadata } from '@/types';
import PhotoCard from './PhotoCard';
import { usePreferences } from '@/components/providers/PreferencesProvider';
import { motion, AnimatePresence } from 'framer-motion';

interface MasonryGridProps {
  photos: PhotoMetadata[];
  forceCompact?: boolean;
  onPhotoClick?: (photoId: string) => void;
  sortBy?: string;
  selectedIds?: Set<string>;
  isSelectionMode?: boolean;
  onToggleSelect?: (photoId: string) => void;
  onLongPress?: (photoId: string) => void;
}

export default function MasonryGrid({ 
  photos, forceCompact, onPhotoClick, sortBy = 'date_desc',
  selectedIds = new Set(), isSelectionMode = false, onToggleSelect, onLongPress
}: MasonryGridProps) {
  const { prefs } = usePreferences();

  if (photos.length === 0) return null;

  // Premium Edge-to-Edge Square Grid Layout (Apple Photos Style)
  let gridClass = "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1 lg:gap-1.5 px-1 lg:px-1.5";
  if (forceCompact || prefs.gridDensity === 'compact') {
    gridClass = "grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-12 gap-0.5 px-0.5";
  } else if (prefs.gridDensity === 'large') {
    return <FocusView photos={photos} onPhotoClick={onPhotoClick} />;
  }

  const isDateSort = sortBy === 'date_desc' || sortBy === 'date_asc';
  
  const groups: { title: string | null, items: PhotoMetadata[] }[] = [];
  let currentGroup: { title: string | null, items: PhotoMetadata[] } | null = null;

  photos.forEach(photo => {
    let groupTitle = null;
    if (isDateSort) {
      const d = new Date(photo.created_at);
      groupTitle = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    }
    
    if (!currentGroup || currentGroup.title !== groupTitle) {
      currentGroup = { title: groupTitle, items: [] };
      groups.push(currentGroup);
    }
    currentGroup.items.push(photo);
  });

  return (
    <div>
      {groups.map((group, index) => (
        <div key={group.title || `group-${index}`} className={group.title ? "mb-8" : "mb-2"}>
          {group.title && (
            <div className="sticky top-[72px] z-20 backdrop-blur-md px-4 lg:px-6 py-2 mb-4" style={{ background: 'var(--bg-primary-transparent)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {group.title}
              </h2>
            </div>
          )}
          <motion.div layout className={gridClass}>
            <AnimatePresence>
              {group.items.map((photo) => (
                <PhotoCard 
                  key={photo.id} 
                  photo={photo} 
                  onClick={onPhotoClick ? () => onPhotoClick(photo.id) : undefined}
                  isSelected={selectedIds.has(photo.id)}
                  isSelectionMode={isSelectionMode}
                  onToggleSelect={() => onToggleSelect && onToggleSelect(photo.id)}
                  onLongPress={() => onLongPress && onLongPress(photo.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      ))}
    </div>
  );
}

import { useState } from 'react';
import Link from 'next/link';
import { usePhotoImage } from '@/hooks/usePhotoImage';

function FocusView({ photos, onPhotoClick }: { photos: PhotoMetadata[], onPhotoClick?: (photoId: string) => void }) {
  const [index, setIndex] = useState(0);
  const current = photos[index];
  const { imageUrl, loading } = usePhotoImage(current?.id || '', true);

  const next = () => setIndex((i) => (i + 1) % photos.length);
  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);

  if (!current) return null;

  return (
    <div className="relative w-full h-[65vh] min-h-[400px] flex items-center justify-center z-0 px-4 lg:px-6 mb-8">
      <div className="relative w-full h-full max-w-5xl flex flex-col items-center justify-center">
        {/* Navigation Buttons */}
        <button 
          onClick={prev}
          className="absolute left-0 lg:-left-12 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all z-10 haptic-tap"
          style={{ color: 'var(--text-primary)', background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <button 
          onClick={next}
          className="absolute right-0 lg:-right-12 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all z-10 haptic-tap"
          style={{ color: 'var(--text-primary)', background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Content */}
        <Link 
          href={`/photo/?id=${current.id}`} 
          className="w-full h-full flex flex-col items-center justify-center group"
          onClick={(e) => {
            if (onPhotoClick) {
              e.preventDefault();
              onPhotoClick(current.id);
            }
          }}
        >
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
            {loading ? (
              <div className="absolute inset-0 skeleton" />
            ) : (
              <img 
                src={imageUrl || undefined} 
                className="w-full h-full object-contain bg-black/20 dark:bg-black/40" 
                alt={current.note || ''} 
              />
            )}
            
            {/* Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">{current.note || 'İsimsiz'}</h3>
                  <p className="text-white/70 text-sm">{current.tags.map(t => `#${t}`).join(' ')}</p>
                </div>
                <div className="text-white/50 text-xs font-mono">
                  {index + 1} / {photos.length}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
