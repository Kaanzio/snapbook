'use client';

import { useState, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import { usePhotos } from '@/hooks/usePhotos';
import { usePhotoImage } from '@/hooks/usePhotoImage';
import { updatePhotoMetadata, notifyDataChange } from '@/lib/indexeddb';
import { showToast } from '@/components/ui/Toast';

interface PhotoSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  alreadyInCollection: string[];
}

export default function PhotoSelectorModal({
  isOpen,
  onClose,
  collectionId,
  alreadyInCollection,
}: PhotoSelectorModalProps) {
  const { photos, loading } = usePhotos();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const availablePhotos = useMemo(() => {
    return photos.filter(p => !alreadyInCollection.includes(p.id));
  }, [photos, alreadyInCollection]);

  const filteredPhotos = useMemo(() => {
    if (!search) return availablePhotos;
    const q = search.toLowerCase();
    return availablePhotos.filter(p => 
      p.note?.toLowerCase().includes(q) || 
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [availablePhotos, search]);

  async function handleAdd() {
    if (selectedIds.length === 0) return;

    for (const id of selectedIds) {
      const photo = photos.find(p => p.id === id);
      if (photo) {
        const updatedIds = [...photo.collection_ids, collectionId];
        await updatePhotoMetadata(id, { collection_ids: updatedIds });
      }
    }

    notifyDataChange('photos');
    showToast(`${selectedIds.length} fotoğraf eklendi`);
    setSelectedIds([]);
    onClose();
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Koleksiyona Fotoğraf Ekle">
      <div className="space-y-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Fotoğraf ara..."
          className="w-full px-4 py-2 rounded-xl themed-input text-sm"
        />

        <div className="max-h-[50vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredPhotos.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>Eklenebilecek fotoğraf bulunamadı.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filteredPhotos.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => toggleSelect(p.id)}
                  className={`aspect-square rounded-lg overflow-hidden relative cursor-pointer border-2 transition-all
                    ${selectedIds.includes(p.id) ? 'border-accent ring-2 ring-accent/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <PhotoThumb photoId={p.id} />
                  {selectedIds.includes(p.id) && (
                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {selectedIds.length} seçim yapıldı
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" style={{ color: 'var(--text-secondary)' }}>
              İptal
            </button>
            <button
              onClick={handleAdd}
              disabled={selectedIds.length === 0}
              className="px-5 py-2 rounded-xl text-sm font-medium btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ekle
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function PhotoThumb({ photoId }: { photoId: string }) {
  const { imageUrl, loading } = usePhotoImage(photoId);
  if (loading) return <div className="w-full h-full skeleton" />;
  return imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full" style={{ background: 'var(--bg-secondary)' }} />;
}
