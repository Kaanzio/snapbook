'use client';

import Link from 'next/link';
import { PhotoMetadata } from '@/types';
import { usePhotoImage } from '@/hooks/usePhotoImage';
import { useCategories } from '@/hooks/useCategories';
import StarToggle from '@/components/ui/StarToggle';
import { updatePhotoMetadata, notifyDataChange } from '@/lib/indexeddb';

interface PhotoCardProps {
  photo: PhotoMetadata;
}

export default function PhotoCard({ photo }: PhotoCardProps) {
  const { imageUrl, isLocal, loading } = usePhotoImage(photo.id);
  const { getCategoryInfo } = useCategories();
  const category = getCategoryInfo(photo.category);

  if (!isLocal && !loading) {
    return <PhotoPlaceholder photo={photo} />;
  }

  return (
    <Link href={`/photo/${photo.id}`} className="block break-inside-avoid mb-3 group haptic-tap">
      <div className="relative themed-card overflow-hidden">
        {/* Image */}
        <div className="relative overflow-hidden">
          {loading ? (
            <div className="aspect-square skeleton" />
          ) : (
            <img
              src={imageUrl || ''}
              alt={photo.note || 'Fotoğraf'}
              className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-500"
              loading="lazy"
            />
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent 
            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Category badge */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm shadow-sm"
              style={{ color: category.color, background: 'var(--bg-nav)' }}
            >
              <span className="text-sm">{category.icon}</span>
              {category.label}
            </span>
          </div>

          {/* Star */}
          <div
            className="absolute top-2.5 right-2.5"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              updatePhotoMetadata(photo.id, { is_starred: !photo.is_starred }).then(() => {
                notifyDataChange('photos');
              });
            }}
          >
            <StarToggle starred={photo.is_starred} onChange={() => {}} size="sm" />
          </div>

          {/* Note preview on hover */}
          {photo.note && (
            <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">{photo.note}</p>
            </div>
          )}
        </div>

        {/* Tags */}
        {photo.tags.length > 0 && (
          <div className="px-3 py-2 flex flex-wrap gap-1">
            {photo.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[11px] font-medium text-accent">
                #{tag}
              </span>
            ))}
            {photo.tags.length > 3 && (
              <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>+{photo.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function PhotoPlaceholder({ photo }: { photo: PhotoMetadata }) {
  const { getCategoryInfo } = useCategories();
  const category = getCategoryInfo(photo.category);

  return (
    <div className="break-inside-avoid mb-3">
      <div className="rounded-2xl overflow-hidden border-2 border-dashed p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--bg-secondary)' }}>
            <svg className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v12a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Bu fotoğraf başka bir cihazda</p>
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{photo.device_name}</p>
          <span
            className="inline-flex items-center gap-1 mt-3 px-2 py-1 rounded-lg text-[11px] font-medium"
            style={{ color: category.color, background: 'var(--bg-secondary)' }}
          >
            {category.icon} {category.label}
          </span>
        </div>
      </div>
    </div>
  );
}
