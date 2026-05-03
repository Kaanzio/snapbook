'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { getAllCanvases, saveCanvas, deleteCanvas, notifyDataChange } from '@/lib/indexeddb';
import { CanvasData } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/Toast';

export default function CanvasListPage() {
  const router = useRouter();
  const [canvases, setCanvases] = useState<CanvasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRename, setShowRename] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

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
    const newCanvas: CanvasData = {
      id,
      name: `Canvas ${canvases.length + 1}`,
      created_at: new Date(),
      updated_at: new Date(),
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [],
      edges: [],
    };
    await saveCanvas(newCanvas);
    notifyDataChange('canvases');
    router.push(`/canvas/${id}`);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm('Bu canvas\'ı silmek istediğinize emin misiniz?')) {
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

  return (
    <div className="min-h-screen page-enter">
      {/* Header */}
      <header className="sticky top-0 z-30 themed-header">
        <div className="px-4 lg:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Canvas</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {loading ? 'Yükleniyor...' : `${canvases.length} canvas`}
            </p>
          </div>
          <button
            onClick={createNewCanvas}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium btn-accent text-white"
          >
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
            icon="🎨"
            title="Henüz canvas yok"
            description="Fotoğraflarınızı serbest bir tuval üzerine yerleştirin, bağlantılar oluşturun"
            action={
              <button
                onClick={createNewCanvas}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium btn-accent text-white"
              >
                İlk Canvas'ı Oluştur
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {canvases.map((canvas) => (
              <div
                key={canvas.id}
                onClick={() => router.push(`/canvas/${canvas.id}`)}
                className="group relative themed-card p-5 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                      </svg>
                    </div>
                    <div>
                      {showRename === canvas.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(canvas.id)}
                            className="text-sm font-semibold px-2 py-1 rounded-lg themed-input w-32"
                            autoFocus
                          />
                          <button onClick={() => handleRename(canvas.id)} className="p-1 rounded text-accent">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{canvas.name}</h3>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {canvas.nodes.length} öğe · {canvas.edges.length} bağlantı
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRename(canvas.id);
                        setRenameValue(canvas.name);
                      }}
                      className="p-1.5 rounded-lg transition-colors hover:bg-accent-soft"
                      style={{ color: 'var(--text-tertiary)' }}
                      title="Yeniden adlandır"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(canvas.id, e)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      title="Sil"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
                  Son güncelleme: {new Date(canvas.updated_at).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
