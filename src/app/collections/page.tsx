'use client';

import { useState } from 'react';
import { usePhotos } from '@/hooks/usePhotos';
import { useCollections } from '@/hooks/useCollections';
import { v4 as uuidv4 } from 'uuid';
import { createCollection, deleteCollection, updateCollection, notifyDataChange } from '@/lib/indexeddb';
import CollectionForm from '@/components/collections/CollectionForm';
import EmptyState from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/Toast';
import Link from 'next/link';
import { usePhotoImage } from '@/hooks/usePhotoImage';
import Modal from '@/components/ui/Modal';
import { PhotoMetadata } from '@/types';
import { useDialog } from '@/components/providers/DialogProvider';

export default function CollectionsPage() {
  const { photos } = usePhotos();
  const { collections, loading } = useCollections();
  const [showForm, setShowForm] = useState(false);
  const { confirm } = useDialog();
  const [editingCollection, setEditingCollection] = useState<{ id: string, name: string, description: string | null } | null>(null);
  const [selectingCoverForId, setSelectingCoverForId] = useState<string | null>(null);

  async function handleCreate(name: string, description: string) {
    await createCollection({
      id: uuidv4(),
      name,
      description: description || null,
      created_at: new Date(),
    });
    notifyDataChange('collections');
    showToast('Koleksiyon oluşturuldu');
  }

  async function handleDelete(id: string) {
    if (await confirm('Bu koleksiyonu silmek istediğinize emin misiniz?')) {
      await deleteCollection(id);
      notifyDataChange('collections');
      showToast('Koleksiyon silindi');
    }
  }

  async function handleEdit(name: string, description: string) {
    if (editingCollection) {
      await updateCollection(editingCollection.id, { name, description });
      setEditingCollection(null);
      notifyDataChange('collections');
      showToast('Koleksiyon güncellendi');
    }
  }

  async function handleSetCover(photoId: string) {
    if (selectingCoverForId) {
      await updateCollection(selectingCoverForId, { cover_photo_id: photoId });
      setSelectingCoverForId(null);
      notifyDataChange('collections');
      showToast('Kapak fotoğrafı güncellendi');
    }
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 themed-header">
        <div className="px-4 lg:px-6 py-6 mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Koleksiyonlar
            </h1>
            <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {loading ? 'Yükleniyor...' : `${collections.length} koleksiyon`}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="p-3 rounded-full btn-accent haptic-tap cursor-pointer transition-transform hover:scale-105 active:scale-95"
            title="Yeni Koleksiyon"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 lg:px-6 pt-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <div className="skeleton aspect-[4/3] rounded-[24px]" />
                <div className="space-y-2">
                  <div className="skeleton h-6 w-3/4 rounded-lg" />
                  <div className="skeleton h-4 w-1/2 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="py-20">
            <EmptyState
              icon={
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
                </svg>
              }
              title="Henüz koleksiyon yok"
              description="Fotoğraflarınızı gruplamak için koleksiyon oluşturun"
              action={
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold btn-accent"
                >
                  Koleksiyon Oluştur
                </button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10">
            {collections.map((coll) => {
              // Only get the very first photo to use as the majestic album cover
              const collectionPhotos = photos.filter((p) => p.collection_ids.includes(coll.id));
              const coverPhoto = (coll.cover_photo_id ? photos.find(p => p.id === coll.cover_photo_id) : null)
                || (collectionPhotos.length > 0 ? collectionPhotos[collectionPhotos.length - 1] : null);
              const count = collectionPhotos.length;
              
              return (
                <div key={coll.id} className="group relative flex flex-col gap-4">
                  <Link
                    href={`/collections/view?id=${coll.id}`}
                    className="block aspect-[4/3] relative rounded-[24px] overflow-hidden transition-transform duration-500 ease-out active:scale-[0.98]"
                    style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-md)' }}
                  >
                    {coverPhoto ? (
                      <ThumbnailItem photoId={coverPhoto.id} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center opacity-40">
                        <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v12a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        <span className="text-sm font-medium tracking-wider uppercase">Boş Koleksiyon</span>
                      </div>
                    )}
                  </Link>

                  {/* Absolute positioned Action Buttons (Hidden on desktop until hover over the entire group) */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingCollection({ id: coll.id, name: coll.name, description: coll.description });
                      }}
                      className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-all haptic-tap cursor-pointer"
                      title="Düzenle"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(coll.id);
                      }}
                      className="p-2.5 rounded-full bg-black/40 hover:bg-red-500/80 backdrop-blur-md text-white transition-all haptic-tap cursor-pointer"
                      title="Sil"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>

                  {/* Clean Typography Below the Cover */}
                  <Link href={`/collections/view?id=${coll.id}`} className="block px-1 haptic-tap cursor-pointer">
                    <h3 className="text-xl lg:text-2xl font-black tracking-tight truncate transition-colors hover:text-accent" style={{ color: 'var(--text-primary)' }}>
                      {coll.name}
                    </h3>
                    <p className="text-sm font-medium mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                      <span className="text-accent">{count} FOTOĞRAF</span>
                      {coll.description && <span className="opacity-60"> • {coll.description}</span>}
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <CollectionForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />

      {editingCollection && (
        <CollectionForm
          isOpen={!!editingCollection}
          onClose={() => setEditingCollection(null)}
          onSubmit={handleEdit}
          onSelectCover={() => {
            if (editingCollection) {
              setSelectingCoverForId(editingCollection.id);
              setEditingCollection(null);
            }
          }}
          title="Koleksiyonu Düzenle"
          initialName={editingCollection.name}
          initialDescription={editingCollection.description || ''}
        />
      )}

      {selectingCoverForId && (
        <Modal 
          isOpen={!!selectingCoverForId} 
          onClose={() => setSelectingCoverForId(null)} 
          title="Kapak Fotoğrafı Seç"
        >
          <div className="grid grid-cols-3 gap-3 p-1 max-h-[60vh] overflow-y-auto">
            {photos.filter(p => p.collection_ids.includes(selectingCoverForId)).length === 0 ? (
              <div className="col-span-3 py-10 text-center opacity-50">
                Bu koleksiyonda henüz fotoğraf yok.
              </div>
            ) : (
              photos.filter(p => p.collection_ids.includes(selectingCoverForId)).map(photo => (
                <button 
                  key={photo.id} 
                  onClick={() => handleSetCover(photo.id)}
                  className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-accent transition-all haptic-tap cursor-pointer active:scale-95"
                >
                  <ThumbnailItem photoId={photo.id} />
                </button>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// Helper to render thumbnail in grid
function ThumbnailItem({ photoId }: { photoId: string }) {
  const { imageUrl, loading } = usePhotoImage(photoId, true);
  return (
    <div className="w-full h-full">
      {loading ? (
        <div className="w-full h-full skeleton" />
      ) : (
        imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover transition-opacity duration-300" /> : <div className="w-full h-full" style={{ background: 'var(--bg-secondary)' }} />
      )}
    </div>
  );
}
