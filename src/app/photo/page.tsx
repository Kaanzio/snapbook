'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePhotoImage } from '@/hooks/usePhotoImage';
import { useCollections } from '@/hooks/useCollections';
import { getPhotoMetadata } from '@/lib/indexeddb';
import { deletePhoto } from '@/lib/storage';
import { updatePhotoMetadata, notifyDataChange } from '@/lib/indexeddb';
import { useCategories } from '@/hooks/useCategories';
import TagInput from '@/components/ui/TagInput';
import StarToggle from '@/components/ui/StarToggle';
import AddToCollection from '@/components/collections/AddToCollection';
import { showToast } from '@/components/ui/Toast';
import { savePhotoToDevice } from '@/lib/backup';
import { PhotoMetadata } from '@/types';
import Link from 'next/link';

function PhotoDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const photoId = searchParams.get('id');

  const { imageUrl, isLocal, loading: imageLoading } = usePhotoImage(photoId || '', true);
  const { collections } = useCollections();
  const { categories, getCategoryInfo } = useCategories();
  const [photo, setPhoto] = useState<PhotoMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showCollections, setShowCollections] = useState(false);

  // Edit state
  const [editNote, setEditNote] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editCategory, setEditCategory] = useState<string>('other');
  const editingRef = useRef(editing);
  editingRef.current = editing;

  useEffect(() => {
    if (!photoId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      const data = await getPhotoMetadata(photoId!);
      if (!cancelled && data) {
        setPhoto(data);
        if (!editingRef.current) {
          setEditNote(data.note || '');
          setEditTags([...data.tags]);
          setEditCategory(data.category);
        }
      }
      if (!cancelled) setLoading(false);
    }

    load();

    const handleUpdate = () => load();
    window.addEventListener('snapbook-photos-changed', handleUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener('snapbook-photos-changed', handleUpdate);
    };
  }, [photoId]);

  async function handleSave() {
    if (!photo) return;

    await updatePhotoMetadata(photo.id, {
      note: editNote || null,
      tags: editTags,
      category: editCategory,
    });
    
    notifyDataChange('photos');

    setEditing(false);
    showToast('Değişiklikler kaydedildi');
  }

  async function handleDelete() {
    if (!photo) return;
    if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return;

    await deletePhoto(photo.id);
    showToast('Fotoğraf silindi');
    router.push('/');
  }

  async function handleToggleStar() {
    if (!photo) return;
    await updatePhotoMetadata(photo.id, { is_starred: !photo.is_starred });
    notifyDataChange('photos');
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 max-w-4xl mx-auto space-y-6">
        <div className="h-14 flex items-center mb-6">
          <div className="w-10 h-10 rounded-xl skeleton" />
        </div>
        <div className="aspect-[4/3] w-full rounded-2xl skeleton" />
        <div className="space-y-4">
          <div className="h-6 w-1/3 rounded skeleton" />
          <div className="h-4 w-full rounded skeleton" />
          <div className="h-4 w-5/6 rounded skeleton" />
        </div>
      </div>
    );
  }

  if (!photoId || !photo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-6xl mb-4">😕</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Fotoğraf bulunamadı</p>
          <Link href="/" className="text-sm text-accent hover:underline mt-2 inline-block">
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    );
  }

  const category = getCategoryInfo(photo.category);
  const dateStr = photo.created_at.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 themed-header">
        <div className="px-4 lg:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl transition-colors text-slate-500 haptic-tap hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <StarToggle starred={photo.is_starred} onChange={handleToggleStar} />

            <button
              onClick={() => setShowCollections(true)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="Koleksiyona ekle"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </button>

            <button
              onClick={async () => {
                const success = await savePhotoToDevice(photo.id, photo.note || undefined);
                if (success) showToast('Fotoğraf kaydedildi');
              }}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="Cihaza kaydet"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>

            <button
              onClick={handleDelete}
              className="p-2 rounded-xl transition-colors text-red-500 hover:bg-red-500/10 haptic-tap"
              title="Sil"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Image */}
        <div style={{ background: 'var(--bg-secondary)' }}>
          {imageLoading ? (
            <div className="aspect-[4/3] skeleton" />
          ) : isLocal ? (
            <img
              src={imageUrl || ''}
              alt={photo.note || 'Fotoğraf'}
              className="w-full h-auto max-h-[70vh] object-contain mx-auto"
            />
          ) : (
            <div className="aspect-[4/3] flex flex-col items-center justify-center" style={{ background: 'var(--bg-card)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--bg-secondary)' }}>
                <svg className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Bu fotoğraf başka bir cihazda</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{photo.device_name}</p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="p-4 lg:p-6 space-y-5">
          {/* Category & Date */}
          <div className="flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ backgroundColor: category.color + '15', color: category.color }}
            >
              {category.icon} {category.label}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{dateStr}</span>
          </div>

          {/* Note */}
          {editing ? (
            <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
              {/* Category edit */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Kategori</label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setEditCategory(cat.key)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all haptic-tap
                        ${editCategory === cat.key
                          ? 'shadow-sm'
                          : 'hover:opacity-80'
                        }`}
                      style={{
                        background: editCategory === cat.key ? 'var(--accent)' : 'var(--bg-secondary)',
                        color: editCategory === cat.key ? 'var(--accent-foreground, white)' : 'var(--text-secondary)',
                        border: editCategory === cat.key ? '1px solid var(--accent)' : '1px solid var(--border-primary)'
                      }}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Not</label>
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl themed-input text-sm resize-none"
                  placeholder="Bir not ekleyin..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Etiketler</label>
                <TagInput tags={editTags} onChange={setEditTags} />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl btn-accent text-sm font-medium haptic-tap"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditNote(photo.note || '');
                    setEditTags([...photo.tags]);
                    setEditCategory(photo.category);
                  }}
                  className="px-5 py-2 rounded-xl text-sm font-medium transition-colors haptic-tap"
                  style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}
                >
                  İptal
                </button>
              </div>
            </div>
          ) : (
            <div>
              {photo.note ? (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{photo.note}</p>
              ) : (
                <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>Not eklenmemiş</p>
              )}

              {/* Tags */}
              {photo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {photo.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => setEditing(true)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium transition-colors text-accent hover:opacity-80"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Düzenle
              </button>
            </div>
          )}

          {/* Info section */}
          <div className="pt-4 space-y-2.5" style={{ borderTop: '1px solid var(--border-primary)' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
              {photo.device_name}
            </div>

            {photo.latitude && photo.longitude && (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
                <a
                  href={`https://www.google.com/maps?q=${photo.latitude},${photo.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Haritada göster
                </a>
              </div>
            )}

            {photo.collection_ids.length > 0 && (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                {photo.collection_ids.length} koleksiyonda
              </div>
            )}

            <button
              onClick={async () => {
                const success = await savePhotoToDevice(photo.id, photo.note || undefined);
                if (success) showToast('Fotoğraf kaydedildi');
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-medium transition-all haptic-tap mt-4"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
            >
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Fotoğrafı Galeriye Kaydet / Paylaş
            </button>
          </div>
        </div>
      </div>

      {/* Add to collection modal */}
      {showCollections && (
        <AddToCollection
          isOpen={showCollections}
          onClose={() => setShowCollections(false)}
          photo={photo}
          collections={collections}
        />
      )}
    </div>
  );
}

export default function PhotoDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen skeleton" />}>
      <PhotoDetailContent />
    </Suspense>
  );
}
