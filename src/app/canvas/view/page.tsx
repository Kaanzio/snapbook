'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import {
  ReactFlow, Background, BackgroundVariant,
  useNodesState, useEdgesState, addEdge,
  Connection, Edge, Node, ReactFlowProvider, useReactFlow, Controls,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { getCanvas, saveCanvas, notifyDataChange } from '@/lib/indexeddb';
import { usePhotos } from '@/hooks/usePhotos';
import { PhotoMetadata } from '@/types';
import { showToast } from '@/components/ui/Toast';
import { useDialog } from '@/components/providers/DialogProvider';
import PhotoNode from '@/components/canvas/PhotoNode';
import TextNode from '@/components/canvas/TextNode';
import StickyNode from '@/components/canvas/StickyNode';
import CustomEdge from '@/components/canvas/CustomEdge';
import CanvasContextMenu from '@/components/canvas/CanvasContextMenu';
import { usePhotoImage } from '@/hooks/usePhotoImage';
import { toPng } from 'html-to-image';

const nodeTypes = { photo: PhotoNode, text: TextNode, sticky: StickyNode };
const edgeTypes = { custom: CustomEdge };

/* ── Sidebar Photo Thumb ── */
function DrawerPhotoItem({ photo, onClick }: { photo: PhotoMetadata; onClick: () => void }) {
  const { imageUrl } = usePhotoImage(photo.id, false);
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify(photo));
    e.dataTransfer.effectAllowed = 'move';
  };
  return (
    <div
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      className="aspect-square rounded-xl overflow-hidden cursor-pointer active:scale-95 hover:ring-2 hover:ring-accent transition-all relative bg-neutral-800 border border-white/5 group shadow-sm"
    >
      {imageUrl && <img src={imageUrl} alt="" className="w-full h-full object-cover pointer-events-none" />}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <svg className="w-5 h-5 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
    </div>
  );
}

/* ── Toolbar Button ── */
function ToolBtn({ onClick, title, children, active, danger }: {
  onClick: () => void; title: string; children: React.ReactNode; active?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 sm:p-2.5 rounded-xl transition-all duration-200 haptic-tap cursor-pointer active:scale-95 flex items-center justify-center ${
        active
          ? 'bg-accent/20 text-accent font-bold'
          : danger
            ? 'text-white/40 hover:text-red-400 hover:bg-red-500/10'
            : 'text-white/60 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

/* ── Main Canvas ── */
function FlowCanvas({
  canvasId,
  canvasName,
  initialNodes,
  initialEdges,
}: {
  canvasId: string;
  canvasName: string;
  initialNodes: Node[];
  initialEdges: Edge[];
}) {
  const router = useRouter();
  const { photos } = usePhotos();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showLibrary, setShowLibrary] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [showCmd, setShowCmd] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [menu, setMenu] = useState<{ id: string; top?: number; left?: number; right?: number; bottom?: number } | null>(null);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [canvasBg, setCanvasBg] = useState('var(--bg-primary)');
  const { fitView, screenToFlowPosition } = useReactFlow();
  const { confirm } = useDialog();

  // Open library by default on larger desktop screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setShowLibrary(true);
    }
  }, []);

  const BG_COLORS = [
    'var(--bg-primary)', 'var(--bg-secondary)', 'var(--bg-card)', '#1a1a2e', '#0f0f23',
    '#1a0a0a', '#0a1a0a', '#0d1117', '#18181b', '#1e1e2e',
    '#282a36', '#1e293b', '#172554', '#fafafa', '#fef9c3',
  ];

  // Drop from library (desktop drag & drop)
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const d = e.dataTransfer.getData('application/reactflow');
    if (!d) return;
    const photo = JSON.parse(d) as PhotoMetadata;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setNodes((nds) => nds.concat({
      id: uuidv4(),
      type: 'photo',
      position,
      data: { photoId: photo.id, photoData: photo },
      width: 260,
      height: 260,
    }));
  }, [screenToFlowPosition, setNodes]);

  // Cleanup legacy data
  useEffect(() => {
    setNodes((nds) => nds.map(n => {
      if (n.data && (n.data as any).onUpdate) {
        const { onUpdate, ...d } = n.data as any;
        return { ...n, data: d };
      }
      return n;
    }));
    setEdges((eds) => eds.map(e => ({
      ...e,
      type: 'custom',
      data: e.data && (e.data as any).onLabelUpdate ? (() => { const { onLabelUpdate, ...d } = e.data as any; return d; })() : e.data,
    })));
  }, []);

  // Auto-save
  useEffect(() => {
    const t = setTimeout(async () => {
      const data = await getCanvas(canvasId);
      if (data) {
        await saveCanvas({ ...data, nodes, edges, updated_at: new Date() });
        notifyDataChange('canvases');
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [nodes, edges, canvasId]);

  const onConnect = useCallback((p: Connection | Edge) => {
    setEdges((eds) => addEdge({ ...p, type: 'custom', data: { edgeType: 'smoothstep' } }, eds));
  }, [setEdges]);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    const pane = document.querySelector('.react-flow__pane');
    if (!pane) return;
    const rect = pane.getBoundingClientRect();
    setMenu({
      id: node.id,
      top: event.clientY < rect.height - 200 ? event.clientY : undefined,
      left: event.clientX < rect.width - 200 ? event.clientX : undefined,
      right: event.clientX >= rect.width - 200 ? rect.width - event.clientX : undefined,
      bottom: event.clientY >= rect.height - 200 ? rect.height - event.clientY : undefined,
    });
  }, []);

  const onPaneClick = useCallback(() => setMenu(null), []);

  // Add nodes helper
  const addText = (pos?: { x: number; y: number }) => {
    const position = pos || { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 50 };
    setNodes((nds) => nds.concat({
      id: uuidv4(),
      type: 'text',
      position,
      data: { text: '', isNew: true },
      width: 220,
      height: 80,
    }));
  };

  const addSticky = () => {
    setNodes((nds) => nds.concat({
      id: uuidv4(),
      type: 'sticky',
      position: { x: window.innerWidth / 2 - 80, y: window.innerHeight / 2 - 60 },
      data: { text: '', isNew: true, colorIndex: Math.floor(Math.random() * 5) },
      width: 200,
      height: 160,
    }));
  };

  const addPhoto = (photo: PhotoMetadata) => {
    if (nodes.some((n) => n.type === 'photo' && n.data.photoId === photo.id)) {
      showToast('Bu fotoğraf zaten tuvalde', 'info');
      return;
    }
    const nodeWidth = window.innerWidth < 640 ? 200 : 260;
    setNodes((nds) => nds.concat({
      id: uuidv4(),
      type: 'photo',
      position: { x: window.innerWidth / 2 - nodeWidth / 2, y: window.innerHeight / 2 - nodeWidth / 2 },
      data: { photoId: photo.id, photoData: photo },
      width: nodeWidth,
      height: nodeWidth,
    }));
    showToast('Fotoğraf tuvale eklendi');
    if (window.innerWidth < 1024) {
      setShowLibrary(false);
    }
  };

  // Actions
  const deleteSelected = useCallback(() => {
    setNodes((n) => n.filter((x) => !x.selected));
    setEdges((e) => e.filter((x) => !x.selected));
  }, [setNodes, setEdges]);

  const selectAll = useCallback(() => {
    setNodes((n) => n.map((x) => ({ ...x, selected: true })));
    setEdges((e) => e.map((x) => ({ ...x, selected: true })));
  }, [setNodes, setEdges]);

  const handleExport = async () => {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el) return;
    try {
      showToast('Görüntü hazırlanıyor...', 'info');
      const url = await toPng(el, { backgroundColor: '#0a0a0a', quality: 1, pixelRatio: 2 });
      const a = document.createElement('a');
      a.download = `kanvas-${canvasName || canvasId}.png`;
      a.href = url;
      a.click();
      showToast('Görüntü indirildi!');
    } catch {
      showToast('Dışa aktarma başarısız oldu', 'error');
    }
  };

  const clearCanvas = async () => {
    if (await confirm('Tüm tuvali temizlemek istediğinize emin misiniz?')) {
      setNodes([]);
      setEdges([]);
      showToast('Tuval temizlendi');
    }
  };

  // Command palette actions
  const commands = [
    { label: 'Fotoğraf Kütüphanesini Aç / Kapat', action: () => { setShowLibrary((v) => !v); setShowCmd(false); } },
    { label: 'Metin Bloğu Ekle', action: () => { addText(); setShowCmd(false); } },
    { label: 'Yapışkan Not Ekle', action: () => { addSticky(); setShowCmd(false); } },
    { label: 'Ekrana Sığdır', action: () => { fitView({ duration: 600 }); setShowCmd(false); } },
    { label: 'Tümünü Seç', action: () => { selectAll(); setShowCmd(false); } },
    { label: 'Seçilenleri Sil', action: () => { deleteSelected(); setShowCmd(false); } },
    { label: 'PNG Olarak İndir', action: () => { handleExport(); setShowCmd(false); } },
    { label: 'Tuvali Temizle', action: () => { clearCanvas(); setShowCmd(false); } },
    { label: 'Kanvaslara Dön', action: () => { router.push('/canvas'); setShowCmd(false); } },
  ];
  const filtered = commands.filter((c) => c.label.toLowerCase().includes(cmdQuery.toLowerCase()));

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey) deleteSelected();
      if (e.ctrlKey && e.key === 'a') { e.preventDefault(); selectAll(); }
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); setShowCmd((v) => !v); setCmdQuery(''); }
      if (e.key === 'Escape') { setShowCmd(false); setShowLibrary(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [deleteSelected, selectAll]);

  const Icon = ({ d }: { d: string }) => (
    <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden flex overscroll-none" style={{ background: canvasBg }}>

      {/* ── Mobile Backdrop for Library Drawer ── */}
      {showLibrary && (
        <div
          onClick={() => setShowLibrary(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        />
      )}

      {/* ── Left Sidebar (Photo Library Drawer) ── */}
      <div
        className={`fixed lg:relative z-[60] h-full flex-shrink-0 flex flex-col bg-neutral-950/95 lg:bg-neutral-950/80 backdrop-blur-3xl border-r border-white/10 transition-all duration-300 ease-in-out shadow-2xl ${
          showLibrary
            ? 'w-[85vw] max-w-[320px] lg:w-[280px] translate-x-0'
            : 'w-[85vw] max-w-[320px] lg:w-0 -translate-x-full lg:translate-x-0 overflow-hidden border-r-0'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-3.5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wide">Fotoğraf Kütüphanesi</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 font-semibold">{photos.length}</span>
          </div>
          <button
            onClick={() => setShowLibrary(false)}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all haptic-tap cursor-pointer"
            title="Kapat"
          >
            <Icon d="M6 18L18 6M6 6l12 12" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-2.5">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              placeholder="Fotoğraflarda ara..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white/90 placeholder:text-white/30 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Photos Grid */}
        <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-2 gap-2 custom-scrollbar auto-rows-min">
          {photos
            .filter((p) => !librarySearch || (p.note || '').toLowerCase().includes(librarySearch.toLowerCase()) || (p.category || '').toLowerCase().includes(librarySearch.toLowerCase()))
            .map((p) => (
              <DrawerPhotoItem key={p.id} photo={p} onClick={() => addPhoto(p)} />
            ))}
          {photos.length === 0 && (
            <div className="col-span-2 py-12 text-center text-xs text-white/30">
              Henüz fotoğraf yok
            </div>
          )}
        </div>

        {/* Drawer Helper Text */}
        <div className="p-2.5 border-t border-white/5 text-center">
          <p className="text-[10px] text-white/40 font-medium">
            Dokunarak veya sürükleyerek tuvale ekleyin
          </p>
        </div>
      </div>

      {/* ── Main Area ── */}
      <div className="flex-1 relative w-full h-full">

        {/* ── Top Left: Back Button ── */}
        <div className="absolute top-4 left-4 z-40">
          <button
            onClick={() => router.push('/canvas')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-2xl border border-white/10 text-white shadow-xl text-xs font-bold transition-all haptic-tap cursor-pointer active:scale-95"
            title="Kanvaslara Geri Dön"
          >
            <Icon d="M15.75 19.5L8.25 12l7.5-7.5" />
            <span className="hidden sm:inline">Kanvaslar</span>
          </button>
        </div>

        {/* ── Top Center: Canvas Title ── */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-[45vw] truncate pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-xl bg-black/50 backdrop-blur-2xl border border-white/10 shadow-xl">
            <span className="text-xs font-bold text-white/90 truncate block">
              {canvasName || 'Kanvas'}
            </span>
          </div>
        </div>

        {/* ── Top Right: Actions & Tools ── */}
        <div className="absolute top-4 right-4 z-40 flex items-center gap-1.5 p-1 rounded-xl bg-black/60 backdrop-blur-2xl border border-white/10 shadow-xl">
          {/* Background Picker Toggle */}
          <button
            onClick={() => setShowBgPicker(!showBgPicker)}
            className={`p-2 rounded-lg transition-all haptic-tap cursor-pointer ${showBgPicker ? 'bg-accent/20 text-accent' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
            title="Arka Plan Rengi"
          >
            <Icon d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128z" />
          </button>

          {/* Command Menu */}
          <button
            onClick={() => { setShowCmd(true); setCmdQuery(''); }}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all haptic-tap cursor-pointer"
            title="Komut Menüsü (Ctrl+K)"
          >
            <Icon d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </button>

          {/* Export PNG */}
          <button
            onClick={handleExport}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all haptic-tap cursor-pointer"
            title="Görüntü Olarak İndir (PNG)"
          >
            <Icon d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </button>
        </div>

        {/* ── Bottom Dock ── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl max-w-[95vw] overflow-x-auto no-scrollbar">
          {/* Photos Library Toggle */}
          <ToolBtn onClick={() => setShowLibrary(!showLibrary)} title="Fotoğraflar" active={showLibrary}>
            <Icon d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v12a2.25 2.25 0 002.25 2.25z" />
          </ToolBtn>

          {/* Sticky Note */}
          <ToolBtn onClick={addSticky} title="Not Ekle">
            <Icon d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </ToolBtn>

          {/* Text Block */}
          <ToolBtn onClick={() => addText()} title="Metin Ekle">
            <Icon d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </ToolBtn>

          <div className="w-px h-6 bg-white/10 mx-0.5" />

          {/* Fit View */}
          <ToolBtn onClick={() => fitView({ duration: 600 })} title="Ekrana Sığdır">
            <Icon d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </ToolBtn>

          {/* Delete Selected */}
          <ToolBtn onClick={deleteSelected} title="Seçilenleri Sil" danger>
            <Icon d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </ToolBtn>

          {/* Clear Canvas */}
          <ToolBtn onClick={clearCanvas} title="Tuvali Temizle" danger>
            <Icon d="M6 18L18 6M6 6l12 12" />
          </ToolBtn>
        </div>

        {/* ── Background Color Picker Popup ── */}
        {showBgPicker && (
          <div className="fixed inset-0 z-50" onClick={() => setShowBgPicker(false)}>
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-16 right-4 sm:right-6 p-4 rounded-2xl bg-neutral-900/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] w-[240px] animate-[springIn_0.25s_ease-out]"
            >
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Arka Plan Rengi</p>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {BG_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => { setCanvasBg(color); setShowBgPicker(false); }}
                    className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${canvasBg === color ? 'border-accent scale-110 ring-2 ring-accent/30' : 'border-white/10 hover:border-white/30'}`}
                    style={{ background: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <label className="text-[10px] text-white/40 font-medium">Özel:</label>
                <input
                  type="color"
                  value={canvasBg.startsWith('#') ? canvasBg : '#121212'}
                  onChange={(e) => setCanvasBg(e.target.value)}
                  className="w-7 h-7 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                />
                <span className="text-[10px] text-white/30 font-mono truncate">{canvasBg}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Command Palette Modal ── */}
        {showCmd && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4" onClick={() => setShowCmd(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-neutral-900/95 backdrop-blur-2xl border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
                <Icon d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                <input
                  value={cmdQuery}
                  onChange={(e) => setCmdQuery(e.target.value)}
                  placeholder="Bir komut yazın..."
                  className="flex-1 bg-transparent text-sm text-white/90 focus:outline-none placeholder:text-white/20"
                  autoFocus
                />
                <kbd className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/30 font-mono">ESC</kbd>
              </div>
              <div className="max-h-[300px] overflow-y-auto py-1">
                {filtered.map((c, i) => (
                  <button
                    key={i}
                    onClick={c.action}
                    className="w-full text-left px-4 py-2.5 text-xs sm:text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {c.label}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="px-4 py-6 text-center text-xs text-white/30">Sonuç bulunamadı</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Canvas Board ── */}
        <div className="w-full h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            defaultEdgeOptions={{ type: 'custom' }}
            colorMode="dark"
            panOnDrag={true}
            selectionOnDrag={false}
            elevateNodesOnSelect
            style={{ background: canvasBg }}
            onEdgeDoubleClick={async (_, edge) => {
              if (await confirm('Bu bağlantıyı silmek istediğinize emin misiniz?')) {
                setEdges((e) => e.filter((x) => x.id !== edge.id));
              }
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="rgba(255,255,255,0.08)" style={{ backgroundColor: 'transparent' }} />
            <Controls
              showFitView={false}
              style={{
                background: 'rgba(23,23,23,0.9)',
                borderColor: 'rgba(255,255,255,0.06)',
                fill: 'rgba(255,255,255,0.5)',
                borderRadius: '12px',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
              }}
            />
            {menu && <CanvasContextMenu {...menu} onClose={() => setMenu(null)} />}
          </ReactFlow>
        </div>

        {/* Edge animation + ReactFlow bg override CSS */}
        <style>{`
          @keyframes edgeFlow { to { stroke-dashoffset: -10; } }
          .react-flow { background: ${canvasBg} !important; }
        `}</style>

      </div>{/* end main area */}
    </div>
  );
}

/* ── Loader ── */
function CanvasEditorContent() {
  const searchParams = useSearchParams();
  const canvasId = searchParams.get('id') || '';
  const [initialData, setInitialData] = useState<{ name: string; nodes: Node[]; edges: Edge[] } | null>(null);

  useEffect(() => {
    if (!canvasId) {
      setInitialData({ name: 'Kanvas', nodes: [], edges: [] });
      return;
    }
    (async () => {
      const data = await getCanvas(canvasId);
      if (data) {
        const nodes = (data.nodes || []).map((n: any) => ({
          ...n,
          position: n.position || { x: n.x || 0, y: n.y || 0 },
          type: n.type || 'text',
          data: {
            ...n.data,
            ...(n.photoId && !n.data?.photoId ? { photoId: n.photoId } : {}),
            ...(n.text && !n.data?.text ? { text: n.text } : {}),
          },
        }));
        const edges = (data.edges || []).map((e: any) =>
          e.fromNodeId && !e.source
            ? { ...e, source: e.fromNodeId, target: e.toNodeId, type: 'custom', data: { edgeType: 'smoothstep' } }
            : e
        );
        setInitialData({ name: data.name || 'Kanvas', nodes, edges });
      } else {
        setInitialData({ name: 'Kanvas', nodes: [], edges: [] });
      }
    })();
  }, [canvasId]);

  if (!initialData) {
    return (
      <div className="min-h-[100dvh] bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <FlowCanvas
        canvasId={canvasId}
        canvasName={initialData.name}
        initialNodes={initialData.nodes}
        initialEdges={initialData.edges}
      />
    </ReactFlowProvider>
  );
}

export default function CanvasEditorPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#0a0a0a]" />}>
      <CanvasEditorContent />
    </Suspense>
  );
}
