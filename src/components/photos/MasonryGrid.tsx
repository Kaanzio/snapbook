'use client';

import { PhotoMetadata } from '@/types';
import PhotoCard from './PhotoCard';
import { usePreferences } from '@/components/providers/PreferencesProvider';

interface MasonryGridProps {
  photos: PhotoMetadata[];
  forceCompact?: boolean;
  onPhotoClick?: (photoId: string) => void;
}

export default function MasonryGrid({ photos, forceCompact, onPhotoClick }: MasonryGridProps) {
  const { prefs } = usePreferences();

  if (photos.length === 0) return null;

  // Real Masonry Columns
  let gridClass = "columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 px-4 lg:px-6";
  if (forceCompact || prefs.gridDensity === 'compact') {
    gridClass = "columns-3 sm:columns-4 md:columns-6 lg:columns-8 gap-2 px-2 lg:px-4";
  } else if (prefs.gridDensity === 'large') {
    return <FocusView photos={photos} onPhotoClick={onPhotoClick} />;
  }

  const groups: { title: string, items: PhotoMetadata[] }[] = [];
  let currentGroup: { title: string, items: PhotoMetadata[] } | null = null;

  photos.forEach(photo => {
    const d = new Date(photo.created_at);
    const monthYear = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    
    if (!currentGroup || currentGroup.title !== monthYear) {
      currentGroup = { title: monthYear, items: [] };
      groups.push(currentGroup);
    }
    currentGroup.items.push(photo);
  });

  return (
    <div>
      {groups.map((group) => (
        <div key={group.title} className="mb-8">
          <div className="sticky top-[72px] z-20 backdrop-blur-md px-4 lg:px-6 py-2 mb-4" style={{ background: 'var(--bg-primary-transparent)' }}>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {group.title}
            </h2>
          </div>
          <div className={gridClass}>
            {group.items.map((photo) => (
              <PhotoCard 
                key={photo.id} 
                photo={photo} 
                onClick={onPhotoClick ? () => onPhotoClick(photo.id) : undefined}
              />
            ))}
          </div>
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
