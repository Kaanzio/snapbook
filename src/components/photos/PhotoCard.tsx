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

  // Simple long press handler for mobile
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: isSelected ? 0.96 : 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="relative w-full h-full"
    >
      <Link 
        href={`/photo?id=${photo.id}`} 
        className={`block relative aspect-square rounded-[18px] md:rounded-2xl overflow-hidden group haptic-tap cursor-pointer transition-all duration-300 ${
          isSelected 
            ? 'ring-4 ring-accent shadow-lg bg-accent/20' 
            : 'border border-black/5 dark:border-white/10 hover:shadow-xl bg-black/5'
        }`}
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
        {/* Image */}
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-900/10">
          {loading ? (
            <div className="w-full h-full skeleton" />
          ) : (
            <img
              src={imageUrl || undefined}
              alt={photo.note || 'Fotoğraf'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}

          {/* Depth gradient on hover / selection */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 transition-opacity duration-300 pointer-events-none ${
            isSelected || isSelectionMode ? 'opacity-30' : 'opacity-0 group-hover:opacity-100'
          }`} />

          {/* Selection Indicator (Top Left) */}
          {(isSelectionMode || isSelected) && (
            <div className="absolute top-2.5 left-2.5 z-20">
              <div 
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 shadow-md ${
                  isSelected ? 'bg-accent border-accent text-white scale-110' : 'bg-black/40 border-white/80 backdrop-blur-md'
                }`}
              >
                {isSelected && (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Star Toggle (Top Right) */}
          <div
            className={`absolute top-2 right-2 z-20 transition-all duration-200 ${
              photo.is_starred ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              updatePhotoMetadata(photo.id, { is_starred: !photo.is_starred }).then(() => {
                notifyDataChange('photos');
              });
            }}
          >
            <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/70 hover:scale-110 transition-all">
              <StarToggle starred={photo.is_starred} onChange={() => {}} size="sm" />
            </div>
          </div>

          {/* Note overlay on hover (only if note exists) */}
          {photo.note && (
            <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
              <p className="text-[11px] font-medium text-white line-clamp-1 drop-shadow-md">
                {photo.note}
              </p>
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
    <div className="break-inside-avoid mb-2">
      <div className="rounded-2xl overflow-hidden border border-dashed p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
        <div className="flex flex-col items-center justify-center text-center py-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: 'var(--bg-secondary)' }}>
            <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v12a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-[11px] font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>Başka cihazda depolanıyor</p>
          <span
            className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-medium"
            style={{ color: category.color, background: 'var(--bg-secondary)' }}
          >
            <CategoryIcon categoryKey={category.key} className="w-3 h-3" /> {category.label}
          </span>
        </div>
      </div>
    </div>
  );
}
