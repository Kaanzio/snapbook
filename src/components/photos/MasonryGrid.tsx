'use client';

import { PhotoMetadata } from '@/types';
import PhotoCard from './PhotoCard';
import { usePreferences } from '@/components/providers/PreferencesProvider';

interface MasonryGridProps {
  photos: PhotoMetadata[];
}

export default function MasonryGrid({ photos }: MasonryGridProps) {
  const { prefs } = usePreferences();

  if (photos.length === 0) return null;

  // Real Masonry Columns
  let gridClass = "columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 px-4 lg:px-6";
  if (prefs.gridDensity === 'compact') {
    gridClass = "columns-3 sm:columns-4 md:columns-6 lg:columns-8 gap-2 px-2 lg:px-4";
  } else if (prefs.gridDensity === 'large') {
    return <FocusView photos={photos} />;
  }

  return (
    <div className={gridClass}>
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  );
}

import { useState } from 'react';
import Link from 'next/link';
import { usePhotoImage } from '@/hooks/usePhotoImage';

function FocusView({ photos }: { photos: PhotoMetadata[] }) {
  const [index, setIndex] = useState(0);
  const current = photos[index];
  const { imageUrl, loading } = usePhotoImage(current?.id || '', true);

  const next = () => setIndex((i) => (i + 1) % photos.length);
  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);

  if (!current) return null;

  return (
    <div className="fixed inset-0 top-14 bottom-16 lg:bottom-0 flex items-center justify-center bg-black/5 z-0 p-4 lg:p-10">
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
        <Link href={`/photo/${current.id}`} className="w-full h-full flex flex-col items-center justify-center group">
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]">
            {loading ? (
              <div className="absolute inset-0 skeleton" />
            ) : (
              <img 
                src={imageUrl || ''} 
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
