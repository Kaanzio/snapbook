'use client';

import { useSearchParams } from 'next/navigation';
import { usePhotos } from '@/hooks/usePhotos';
import { useCollections } from '@/hooks/useCollections';
import MasonryGrid from '@/components/photos/MasonryGrid';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { useMemo, useState, Suspense } from 'react';
import PhotoSelectorModal from '@/components/collections/PhotoSelectorModal';
import CollectionForm from '@/components/collections/CollectionForm';
import { updateCollection, notifyDataChange } from '@/lib/indexeddb';
import { showToast } from '@/components/ui/Toast';

function CollectionDetailContent() {
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('id') || '';
  const { photos, loading: photosLoading } = usePhotos();
  const { collections, loading: collectionsLoading } = useCollections();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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

  const collectionPhotos = useMemo(
    () => photos.filter((p) => p.collection_ids.includes(collectionId)),
    [photos, collectionId]
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
            icon="📁"
            title="Bu koleksiyon boş"
            description="Bu koleksiyona fotoğraf ekleyerek başlayın"
            action={
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium btn-accent"
              >
                Fotoğraf Ekle
              </button>
            }
          />
        ) : (
          <MasonryGrid photos={collectionPhotos} />
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
