'use client';

import { useState } from 'react';
import { usePhotos } from '@/hooks/usePhotos';
import { useCollections } from '@/hooks/useCollections';
import { v4 as uuidv4 } from 'uuid';
import { createCollection, deleteCollection, notifyDataChange } from '@/lib/indexeddb';
import CollectionForm from '@/components/collections/CollectionForm';
import EmptyState from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/Toast';
import Link from 'next/link';
import { usePhotoImage } from '@/hooks/usePhotoImage';

export default function CollectionsPage() {
  const { photos } = usePhotos();
  const { collections, loading } = useCollections();
  const [showForm, setShowForm] = useState(false);

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
    if (confirm('Bu koleksiyonu silmek istediğinize emin misiniz?')) {
      await deleteCollection(id);
      notifyDataChange('collections');
      showToast('Koleksiyon silindi');
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 themed-header">
        <div className="px-4 lg:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Koleksiyonlar</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {loading ? 'Yükleniyor...' : `${collections.length} koleksiyon`}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium btn-accent"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Yeni
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 lg:p-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-64 rounded-3xl" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <EmptyState
            icon="📁"
            title="Henüz koleksiyon yok"
            description="Fotoğraflarınızı gruplamak için koleksiyon oluşturun"
            action={
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium btn-accent"
              >
                Koleksiyon Oluştur
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((coll) => {
              const collectionPhotos = photos.filter((p) => p.collection_ids.includes(coll.id)).slice(0, 4);
              const count = photos.filter((p) => p.collection_ids.includes(coll.id)).length;
              
              return (
                <Link
                  key={coll.id}
                  href={`/collections/${coll.id}`}
                  className="group relative block haptic-tap"
                >
                  <div className="themed-card overflow-hidden transition-all duration-300 group-hover:translate-y-[-4px] group-hover:shadow-shadow-accent">
                    {/* Visual Stack / Grid */}
                    <div className="aspect-[4/3] relative bg-slate-100 dark:bg-slate-900 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                      {collectionPhotos.length > 0 ? (
                        <div className="grid grid-cols-2 h-full gap-0.5">
                          {Array.from({ length: 4 }).map((_, idx) => {
                            const photo = collectionPhotos[idx];
                            return (
                              <div key={idx} className="bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                                {photo ? (
                                  <ThumbnailItem photoId={photo.id} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center opacity-20">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z" /></svg>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center opacity-30">
                          <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v12a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                          <span className="text-xs font-medium">Boş Koleksiyon</span>
                        </div>
                      )}
                      
                      {/* Photo Count Badge */}
                      <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                        {count} FOTOĞRAF
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate transition-colors group-hover:text-accent" style={{ color: 'var(--text-primary)' }}>
                          {coll.name}
                        </h3>
                        {coll.description ? (
                          <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--text-tertiary)' }}>
                            {coll.description}
                          </p>
                        ) : (
                          <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Açıklama yok</p>
                        )}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(coll.id);
                        }}
                        className="p-2 -mr-1 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <CollectionForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}

// Helper to render thumbnail in grid
function ThumbnailItem({ photoId }: { photoId: string }) {
  const { imageUrl, loading } = usePhotoImage(photoId);
  return (
    <div className="w-full h-full">
      {loading ? (
        <div className="w-full h-full skeleton" />
      ) : (
        <img src={imageUrl || ''} alt="" className="w-full h-full object-cover" />
      )}
    </div>
  );
}
