'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PhotoMetadata } from '@/types';
import { usePhotoImage } from '@/hooks/usePhotoImage';
import { useCategories } from '@/hooks/useCategories';
import StarToggle from '@/components/ui/StarToggle';
import { updatePhotoMetadata, notifyDataChange } from '@/lib/indexeddb';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface PhotoCardProps {
  photo: PhotoMetadata;
  onClick?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
  onLongPress?: () => void;
}

export default function PhotoCard({ 
  photo, onClick, isSelected = false, isSelectionMode = false, onToggleSelect, onLongPress 
}: PhotoCardProps) {
  const { imageUrl, isLocal, loading } = usePhotoImage(photo.id);
  const { getCategoryInfo } = useCategories();
  const category = getCategoryInfo(photo.category);

  // Simple long press handler
  let touchTimer: NodeJS.Timeout;
  const handleTouchStart = () => {
    if (onLongPress && !isSelectionMode) {
      touchTimer = setTimeout(() => {
        onLongPress();
      }, 500);
    }
  };
  const handleTouchEnd = () => {
    if (touchTimer) clearTimeout(touchTimer);
  };

  if (!isLocal && !loading) {
    return <PhotoPlaceholder photo={photo} />;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: isSelected ? 0.95 : 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="relative"
    >
      <Link 
        href={`/photo/?id=${photo.id}`} 
        className={`block relative aspect-square rounded-[18px] md:rounded-2xl overflow-hidden group haptic-tap shadow-sm transition-all duration-300 ${isSelected ? 'ring-4 ring-accent bg-accent/20' : 'bg-black/5 border border-white/5'}`}
        onClick={(e) => {
          if (isSelectionMode && onToggleSelect) {
            e.preventDefault();
            onToggleSelect(e);
            return;
          }
          if (onClick) {
            e.preventDefault();
            onClick(e);
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
      >
      <div className="absolute inset-0 w-full h-full">
        {/* Image */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {loading ? (
            <div className="w-full h-full skeleton" />
          ) : (
            <img
              src={imageUrl || undefined}
              alt={photo.note || 'Fotoğraf'}
              className={`w-full h-full object-cover transition-transform duration-700 ${isSelected ? 'scale-110' : 'group-hover:scale-[1.03]'}`}
              loading="lazy"
            />
          )}

          {/* Hover overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-opacity duration-300 ${isSelected || isSelectionMode ? 'opacity-20' : 'opacity-0 group-hover:opacity-100'}`} />

          {/* Selection Indicator */}
          {(isSelectionMode || isSelected) && (
            <div className="absolute top-2 left-2 z-20">
              <div 
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-accent border-accent text-white' : 'bg-black/20 border-white/70 backdrop-blur-md'}`}
              >
                {isSelected && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm shadow-sm"
              style={{ color: category.color, background: 'var(--bg-nav)' }}
            >
              <CategoryIcon categoryKey={category.key} className="w-3.5 h-3.5" />
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
    </motion.div>
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
            className="inline-flex items-center gap-1.5 mt-3 px-2 py-1.5 rounded-lg text-[11px] font-medium"
            style={{ color: category.color, background: 'var(--bg-secondary)' }}
          >
            <CategoryIcon categoryKey={category.key} className="w-3.5 h-3.5" /> {category.label}
          </span>
        </div>
      </div>
    </div>
  );
}
