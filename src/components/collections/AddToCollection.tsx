'use client';

import { Collection, PhotoMetadata } from '@/types';
import Modal from '@/components/ui/Modal';
import { updatePhotoMetadata, notifyDataChange } from '@/lib/indexeddb';
import { showToast } from '@/components/ui/Toast';

interface AddToCollectionProps {
  isOpen: boolean;
  onClose: () => void;
  photo: PhotoMetadata;
  collections: Collection[];
}

export default function AddToCollection({ isOpen, onClose, photo, collections }: AddToCollectionProps) {
  async function toggleCollection(collId: string) {
    const isInCollection = photo.collection_ids.includes(collId);
    const newIds = isInCollection
      ? photo.collection_ids.filter((id) => id !== collId)
      : [...photo.collection_ids, collId];

    await updatePhotoMetadata(photo.id, { collection_ids: newIds });
    notifyDataChange('photos');
    showToast(isInCollection ? 'Koleksiyondan çıkarıldı' : 'Koleksiyona eklendi');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Koleksiyona Ekle">
      {collections.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-400">Henüz koleksiyon yok</p>
          <p className="text-xs text-slate-300 mt-1">Koleksiyonlar sayfasından oluşturun</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {collections.map((coll) => {
            const isSelected = photo.collection_ids.includes(coll.id);
            return (
              <button
                key={coll.id}
                onClick={() => toggleCollection(coll.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border haptic-tap cursor-pointer
                  ${isSelected ? 'shadow-sm' : 'hover:opacity-80'}`}
                style={{
                  background: isSelected ? 'var(--accent)' : 'var(--bg-card)',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border-primary)',
                }}
              >
                <div
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.2)' : 'transparent',
                    borderColor: isSelected ? 'var(--accent-foreground, white)' : 'var(--border-primary)'
                  }}
                >
                  {isSelected && (
                    <svg className="w-3 h-3" style={{ color: 'var(--accent-foreground, white)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: isSelected ? 'var(--accent-foreground, white)' : 'var(--text-primary)' }}>
                    {coll.name}
                  </p>
                  {coll.description && (
                    <p className="text-xs truncate opacity-70" style={{ color: isSelected ? 'var(--accent-foreground, white)' : 'var(--text-secondary)' }}>
                      {coll.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
