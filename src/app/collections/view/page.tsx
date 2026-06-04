'use client';

import { useSearchParams } from 'next/navigation';
import { usePhotos } from '@/hooks/usePhotos';
import { useCollections } from '@/hooks/useCollections';
import MasonryGrid from '@/components/photos/MasonryGrid';
import { usePreferences } from '@/components/providers/PreferencesProvider';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { useMemo, useState, Suspense } from 'react';
import PhotoSelectorModal from '@/components/collections/PhotoSelectorModal';
import CollectionForm from '@/components/collections/CollectionForm';
import { updateCollection, notifyDataChange } from '@/lib/indexeddb';
import { showToast } from '@/components/ui/Toast';
import { Collection } from '@/types';

function CollectionDetailContent() {
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('id') || '';
  const { photos, loading: photosLoading } = usePhotos();
  const { collections, loading: collectionsLoading } = useCollections();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isSelectingCover, setIsSelectingCover] = useState(false);
  const { prefs, updatePrefs } = usePreferences();

  const toggleDensity = () => {
    const modes = ['compact', 'normal', 'large'];
    const currentIndex = modes.indexOf(prefs.gridDensity);
    const nextMode = modes[(currentIndex + 1) % modes.length] as any;
    updatePrefs({ gridDensity: nextMode });
  };

  const collection = useMemo(
    () => collections.find((c) => c.id === collectionId),
    [collections, collectionId]
  );

  async function handleUpdate(name: string, description: string) {
    if (collection) {
      await updateCollection(collectionId, { name, description });
      notifyDataChange('collections');
      showToast('Koleksiyon güncellendi');
    }
  }

  async function handleSetCover(photoId: string) {
    if (collection) {
      await updateCollection(collectionId, { cover_photo_id: photoId });
      notifyDataChange('collections');
      setIsSelectingCover(false);
      showToast('Kapak fotoğrafı güncellendi');
    }
  }

  const collectionPhotos = useMemo(
    () => {
      let filtered = photos.filter((p) => p.collection_ids.includes(collectionId));
      if (showFavorites) {
        filtered = filtered.filter(p => p.is_starred);
      }
      return filtered;
    },
    [photos, collectionId, showFavorites]
  );

  const loading = photosLoading || collectionsLoading;
  const photoIdsInCollection = useMemo(() => collectionPhotos.map(p => p.id), [collectionPhotos]);

  if (!loading && !collection) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-6xl mb-4">📁</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Koleksiyon bulunamadı</p>
          <Link href="/collections" className="text-sm text-accent hover:underline mt-2 inline-block">
            Koleksiyonlara dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 themed-header">
        <div className="px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/collections"
              className="p-2 -ml-2 rounded-xl transition-colors text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 haptic-tap"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {collection?.name || 'Koleksiyon'}
                </h1>
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  title="Düzenle"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
              </div>
              {collection?.description && (
                <p className="text-sm mt-0.5 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{collection.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className="p-2 rounded-xl transition-colors haptic-tap"
              style={{
                background: showFavorites ? 'var(--accent)' : 'var(--bg-secondary)',
                color: showFavorites ? 'var(--accent-foreground, white)' : 'var(--text-secondary)'
              }}
              title="Favoriler"
            >
              <svg className="w-4 h-4" fill={showFavorites ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </button>

            <button
              onClick={toggleDensity}
              className="p-2 rounded-xl transition-colors haptic-tap"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              title="Görünümü Değiştir"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {prefs.gridDensity === 'compact' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />}
                {prefs.gridDensity === 'comfortable' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />}
                {prefs.gridDensity === 'large' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />}
              </svg>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium btn-accent shadow-lg shadow-accent/20 haptic-tap"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="hidden sm:inline">Fotoğraf Ekle</span>
              <span className="sm:hidden">Ekle</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="pt-4 pb-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4 lg:px-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl skeleton" />
            ))}
          </div>
        ) : collectionPhotos.length === 0 ? (
          <EmptyState
            icon={showFavorites ? "⭐" : "📁"}
            title={showFavorites ? "Favori fotoğraf bulunamadı" : "Bu koleksiyon boş"}
            description={showFavorites ? "Bu koleksiyonda henüz favorilere eklenmiş bir fotoğraf yok." : "Bu koleksiyona fotoğraf ekleyerek başlayın"}
            action={
              !showFavorites ? (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium btn-accent"
                >
                  Fotoğraf Ekle
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            {isSelectingCover && (
              <div className="mx-4 lg:mx-6 mb-4 p-4 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-between animate-[fade-in_0.3s_ease-out]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-accent">Kapak yapmak istediğiniz fotoğrafa tıklayın</p>
                </div>
                <button 
                  onClick={() => setIsSelectingCover(false)}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs font-black uppercase tracking-wider shadow-sm hover:shadow-md transition-all haptic-tap"
                  style={{ color: 'var(--text-primary)' }}
                >
                  İptal
                </button>
              </div>
            )}
            <MasonryGrid 
              photos={collectionPhotos} 
              onPhotoClick={isSelectingCover ? handleSetCover : undefined}
            />
          </>
        )}
      </div>

      <PhotoSelectorModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        collectionId={collectionId}
        alreadyInCollection={photoIdsInCollection}
      />

      {collection && (
        <CollectionForm
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdate}
          onSelectCover={() => {
            setShowEditModal(false);
            setIsSelectingCover(true);
          }}
          title="Koleksiyonu Düzenle"
          initialName={collection.name}
          initialDescription={collection.description || ''}
        />
      )}
    </div>
  );
}

export default function CollectionDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen skeleton" />}>
      <CollectionDetailContent />
    </Suspense>
  );
}
