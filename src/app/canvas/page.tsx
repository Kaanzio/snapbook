'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { getAllCanvases, saveCanvas, deleteCanvas, notifyDataChange } from '@/lib/indexeddb';
import { CanvasData } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/Toast';
import { useDialog } from '@/components/providers/DialogProvider';
import { usePhotos } from '@/hooks/usePhotos';
import { usePhotoImage } from '@/hooks/usePhotoImage';

export default function CanvasListPage() {
  const router = useRouter();
  const { photos } = usePhotos();
  const { confirm } = useDialog();
  const [canvases, setCanvases] = useState<CanvasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRename, setShowRename] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCoverPhotoId, setNewCoverPhotoId] = useState<string | null>(null);

  useEffect(() => {
    loadCanvases();
    const handler = () => loadCanvases();
    window.addEventListener('snapbook-canvases-changed', handler);
    return () => window.removeEventListener('snapbook-canvases-changed', handler);
  }, []);

  async function loadCanvases() {
    const data = await getAllCanvases();
    setCanvases(data);
    setLoading(false);
  }

  async function createNewCanvas() {
    const id = uuidv4();
    const name = newName.trim() || `Canvas ${canvases.length + 1}`;
    const nodes: CanvasData['nodes'] = [];

    // If a cover photo was selected, add it as the first node
    if (newCoverPhotoId) {
      const photo = photos.find(p => p.id === newCoverPhotoId);
      if (photo) {
        nodes.push({
          id: uuidv4(),
          type: 'photo',
          position: { x: 0, y: 0 },
          data: { photoId: photo.id, photoData: photo },
          width: 300,
          height: 300,
        } as any);
      }
    }

    const newCanvas: CanvasData = {
      id, name,
      created_at: new Date(),
      updated_at: new Date(),
      viewport: { x: 0, y: 0, zoom: 1 },
      coverPhotoId: newCoverPhotoId || undefined,
      nodes,
      edges: [],
    };
    await saveCanvas(newCanvas);
    notifyDataChange('canvases');
    setShowCreate(false);
    setNewName('');
    setNewCoverPhotoId(null);
    router.push(`/canvas/view?id=${id}`);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (await confirm('Bu canvas\'ı silmek istediğinize emin misiniz?')) {
      await deleteCanvas(id);
      notifyDataChange('canvases');
      showToast('Canvas silindi');
    }
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) return;
    const canvas = canvases.find(c => c.id === id);
    if (canvas) {
      await saveCanvas({ ...canvas, name: renameValue.trim(), updated_at: new Date() });
      notifyDataChange('canvases');
      showToast('Canvas yeniden adlandırıldı');
    }
    setShowRename(null);
    setRenameValue('');
  }

  function openCreateModal() {
    setNewName('');
    setNewCoverPhotoId(null);
    setShowCreate(true);
  }

  return (
    <div className="min-h-screen page-enter">
      {/* Header */}
      <header className="sticky top-0 z-30 themed-header">
        <div className="px-4 lg:px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Canvas</h1>
            <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {loading ? 'Yükleniyor...' : `${canvases.length} çalışma yüzeyi`}
            </p>
          </div>
          <button onClick={openCreateModal} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium btn-accent">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Yeni Canvas
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 lg:p-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        ) : canvases.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
            }
            title="Henüz canvas yok"
            description="Fotoğraflarınızı serbest bir tuval üzerine yerleştirin, bağlantılar oluşturun"
            action={
              <button onClick={openCreateModal} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium btn-accent">
                İlk Canvas&#39;ı Oluştur
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10">
            {canvases.map((canvas) => {
              const coverPid = (canvas as any).coverPhotoId || canvas.nodes.find(n => n.type === 'photo')?.data?.photoId;
              return (
                <div key={canvas.id} className="group relative flex flex-col gap-4">
                  <div
                    onClick={() => router.push(`/canvas/view?id=${canvas.id}`)}
                    className="block aspect-[4/3] relative rounded-[24px] overflow-hidden transition-transform duration-500 ease-out active:scale-[0.98] cursor-pointer"
                    style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-md)' }}
                  >
                    {coverPid ? (
                      <CanvasThumbnail photoId={coverPid} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center opacity-30">
                        <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                        </svg>
                        <span className="text-sm font-medium tracking-wider uppercase">Boş Tuval</span>
                      </div>
                    )}
                    {/* Management Buttons */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <button onClick={(e) => { e.stopPropagation(); setShowRename(canvas.id); setRenameValue(canvas.name); }}
                        className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-all haptic-tap" title="Yeniden adlandır">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button onClick={(e) => handleDelete(canvas.id, e)}
                        className="p-2.5 rounded-full bg-black/40 hover:bg-red-500/80 backdrop-blur-md text-white transition-all haptic-tap" title="Sil">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* Name */}
                  <div className="px-1">
                    {showRename === canvas.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(canvas.id)}
                          onBlur={() => handleRename(canvas.id)}
                          className="text-lg font-black tracking-tight px-2 py-1 rounded-lg themed-input w-full" autoFocus />
                      </div>
                    ) : (
                      <>
                        <h3 onClick={() => router.push(`/canvas/view?id=${canvas.id}`)}
                          className="text-xl lg:text-2xl font-black tracking-tight truncate transition-colors hover:text-accent cursor-pointer"
                          style={{ color: 'var(--text-primary)' }}>
                          {canvas.name}
                        </h3>
                        <p className="text-sm font-medium mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                          <span className="text-accent uppercase">{canvas.nodes.length} ÖĞE</span>
                          <span className="opacity-60"> • {new Date(canvas.updated_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create Canvas Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl overflow-hidden border shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>

            {/* Header */}
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Yeni Canvas Oluştur</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-tertiary)' }}>Canvas Adı</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createNewCanvas()}
                  placeholder={`Canvas ${canvases.length + 1}`}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium themed-input"
                  autoFocus
                />
              </div>

              {/* Cover Photo Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                  Kapak Fotoğrafı <span className="text-white/20 normal-case">(opsiyonel)</span>
                </label>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar rounded-xl p-1">
                    {/* No cover option */}
                    <button
                      onClick={() => setNewCoverPhotoId(null)}
                      className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${!newCoverPhotoId ? 'border-accent bg-accent/10' : 'border-transparent hover:border-white/20'}`}
                      style={{ background: !newCoverPhotoId ? undefined : 'var(--bg-secondary)' }}
                    >
                      <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Yok</span>
                    </button>
                    {photos.map(photo => (
                      <CoverPhotoOption
                        key={photo.id}
                        photoId={photo.id}
                        isSelected={newCoverPhotoId === photo.id}
                        onSelect={() => setNewCoverPhotoId(photo.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>Henüz fotoğraf yok</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex items-center justify-end gap-3" style={{ borderColor: 'var(--border-primary)' }}>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                İptal
              </button>
              <button onClick={createNewCanvas} className="px-6 py-2.5 rounded-xl text-sm font-bold btn-accent">
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CoverPhotoOption({ photoId, isSelected, onSelect }: { photoId: string; isSelected: boolean; onSelect: () => void }) {
  const { imageUrl, loading } = usePhotoImage(photoId, true);
  return (
    <button
      onClick={onSelect}
      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${isSelected ? 'border-accent ring-2 ring-accent/30 scale-[1.05]' : 'border-transparent hover:border-white/20'}`}
    >
      {loading ? <div className="w-full h-full skeleton" /> : (imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: 'var(--bg-secondary)' }} />)}
    </button>
  );
}

function CanvasThumbnail({ photoId }: { photoId: string }) {
  const { imageUrl, loading } = usePhotoImage(photoId, true);
  return (
    <div className="w-full h-full">
      {loading ? <div className="w-full h-full skeleton" /> : (imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover transition-opacity duration-300" /> : <div className="w-full h-full" style={{ background: 'var(--bg-secondary)' }} />)}
    </div>
  );
}
