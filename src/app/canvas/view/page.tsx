'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import {
  ReactFlow, MiniMap, Controls, Background, BackgroundVariant,
  useNodesState, useEdgesState, addEdge,
  Connection, Edge, Node, ReactFlowProvider, useReactFlow,
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
    <div onClick={onClick} draggable onDragStart={onDragStart}
      className="aspect-square rounded-lg overflow-hidden cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-indigo-500/40 transition-all relative bg-neutral-800">
      {imageUrl && <img src={imageUrl} alt="" className="w-full h-full object-cover pointer-events-none" />}
    </div>
  );
}

/* ── Toolbar Button ── */
function ToolBtn({ onClick, title, children, active, danger }: {
  onClick: () => void; title: string; children: React.ReactNode; active?: boolean; danger?: boolean;
}) {
  return (
    <button onClick={onClick} title={title}
      className={`p-2.5 rounded-xl transition-all duration-200 ${active ? 'bg-indigo-500/20 text-indigo-300' : danger ? 'text-white/20 hover:text-red-400 hover:bg-red-500/10' : 'text-white/30 hover:text-white hover:bg-white/5'}`}>
      {children}
    </button>
  );
}

/* ── Main Canvas ── */
function FlowCanvas({ canvasId, initialNodes, initialEdges }: { canvasId: string; initialNodes: Node[]; initialEdges: Edge[] }) {
  const router = useRouter();
  const { photos } = usePhotos();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showLibrary, setShowLibrary] = useState(true);
  const [librarySearch, setLibrarySearch] = useState('');
  const [showCmd, setShowCmd] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [menu, setMenu] = useState<{ id: string; top?: number; left?: number; right?: number; bottom?: number } | null>(null);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [canvasBg, setCanvasBg] = useState('#0a0a0a');
  const { fitView, screenToFlowPosition } = useReactFlow();
  const { confirm } = useDialog();

  const BG_COLORS = [
    '#0a0a0a', '#111111', '#1a1a2e', '#0f0f23', '#1a0a0a',
    '#0a1a0a', '#0d1117', '#18181b', '#1e1e2e', '#282a36',
    '#1e293b', '#172554', '#fafafa', '#f5f5f4', '#fef9c3',
  ];

  // Drop from library
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const d = e.dataTransfer.getData('application/reactflow');
    if (!d) return;
    const photo = JSON.parse(d) as PhotoMetadata;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setNodes((nds) => nds.concat({ id: uuidv4(), type: 'photo', position, data: { photoId: photo.id, photoData: photo }, width: 260, height: 260 }));
  }, [screenToFlowPosition, setNodes]);

  // Cleanup legacy data
  useEffect(() => {
    setNodes((nds) => nds.map(n => { if (n.data && (n.data as any).onUpdate) { const { onUpdate, ...d } = n.data as any; return { ...n, data: d }; } return n; }));
    setEdges((eds) => eds.map(e => ({ ...e, type: 'custom', data: e.data && (e.data as any).onLabelUpdate ? (() => { const { onLabelUpdate, ...d } = e.data as any; return d; })() : e.data })));
  }, []);

  // Auto-save
  useEffect(() => {
    const t = setTimeout(async () => {
      const data = await getCanvas(canvasId);
      if (data) { await saveCanvas({ ...data, nodes, edges, updated_at: new Date() }); notifyDataChange('canvases'); }
    }, 1000);
    return () => clearTimeout(t);
  }, [nodes, edges, canvasId]);

  const onConnect = useCallback((p: Connection | Edge) => setEdges((eds) => addEdge({ ...p, type: 'custom', data: { edgeType: 'smoothstep' } }, eds)), [setEdges]);
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    const pane = document.querySelector('.react-flow__pane');
    if (!pane) return;
    const rect = pane.getBoundingClientRect();
    setMenu({ id: node.id, top: event.clientY < rect.height - 200 ? event.clientY : undefined, left: event.clientX < rect.width - 200 ? event.clientX : undefined, right: event.clientX >= rect.width - 200 ? rect.width - event.clientX : undefined, bottom: event.clientY >= rect.height - 200 ? rect.height - event.clientY : undefined });
  }, []);
  const onPaneClick = useCallback(() => setMenu(null), []);

  // Add nodes
  const addText = (pos?: { x: number; y: number }) => {
    const position = pos || { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 50 };
    setNodes((nds) => nds.concat({ id: uuidv4(), type: 'text', position, data: { text: '', isNew: true }, width: 220, height: 80 }));
  };
  const addSticky = () => {
    setNodes((nds) => nds.concat({ id: uuidv4(), type: 'sticky', position: { x: window.innerWidth / 2 - 80, y: window.innerHeight / 2 - 60 }, data: { text: '', isNew: true, colorIndex: Math.floor(Math.random() * 5) }, width: 200, height: 160 }));
  };
  const addPhoto = (photo: PhotoMetadata) => {
    if (nodes.some((n) => n.type === 'photo' && n.data.photoId === photo.id)) { showToast('Already on canvas', 'info'); return; }
    setNodes((nds) => nds.concat({ id: uuidv4(), type: 'photo', position: { x: window.innerWidth / 2 - 130, y: window.innerHeight / 2 - 130 }, data: { photoId: photo.id, photoData: photo }, width: 260, height: 260 }));
    setShowLibrary(false);
  };
  const onPaneDoubleClick = useCallback((e: React.MouseEvent) => { addText(screenToFlowPosition({ x: e.clientX, y: e.clientY })); }, [screenToFlowPosition]);

  // Actions
  const deleteSelected = useCallback(() => { setNodes((n) => n.filter((x) => !x.selected)); setEdges((e) => e.filter((x) => !x.selected)); }, [setNodes, setEdges]);
  const selectAll = useCallback(() => { setNodes((n) => n.map((x) => ({ ...x, selected: true }))); setEdges((e) => e.map((x) => ({ ...x, selected: true }))); }, [setNodes, setEdges]);

  const handleExport = async () => {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el) return;
    try {
      showToast('Exporting...', 'info');
      const url = await toPng(el, { backgroundColor: '#0a0a0a', quality: 1, pixelRatio: 2 });
      const a = document.createElement('a'); a.download = `canvas-${canvasId}.png`; a.href = url; a.click();
      showToast('Exported!');
    } catch { showToast('Export failed', 'error'); }
  };

  const clearCanvas = async () => { if (await confirm('Clear entire canvas?')) { setNodes([]); setEdges([]); showToast('Canvas cleared'); } };

  // Command palette actions
  const commands = [
    { label: 'Add Text Block', action: () => { addText(); setShowCmd(false); } },
    { label: 'Add Sticky Note', action: () => { addSticky(); setShowCmd(false); } },
    { label: 'Open Photo Library', action: () => { setShowLibrary(true); setShowCmd(false); } },
    { label: 'Fit View', action: () => { fitView({ duration: 600 }); setShowCmd(false); } },
    { label: 'Select All', action: () => { selectAll(); setShowCmd(false); } },
    { label: 'Delete Selected', action: () => { deleteSelected(); setShowCmd(false); } },
    { label: 'Export as PNG', action: () => { handleExport(); setShowCmd(false); } },
    { label: 'Clear Canvas', action: () => { clearCanvas(); setShowCmd(false); } },
    { label: 'Back to Canvases', action: () => { router.push('/canvas'); setShowCmd(false); } },
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

  const Icon = ({ d }: { d: string }) => <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;

  return (
    <div className="h-screen w-screen overflow-hidden relative flex" style={{ background: canvasBg }}>

      {/* ── Left Sidebar (VVD style - always visible) ── */}
      <div className={`h-full flex-shrink-0 flex flex-col bg-black/60 backdrop-blur-2xl border-r border-white/[0.06] transition-all duration-500 ${showLibrary ? 'w-[200px]' : 'w-0 overflow-hidden border-r-0'}`}>
        {/* Sidebar Header */}
        <div className="p-3 flex items-center justify-between">
          <button onClick={() => router.push('/canvas')} className="p-1 text-white/30 hover:text-white transition-all">
            <Icon d="M15.75 19.5L8.25 12l7.5-7.5" />
          </button>
          <span className="text-[10px] font-semibold text-white/40 tracking-wider uppercase">Canvas</span>
          <button onClick={() => setShowLibrary(false)} className="p-1 text-white/20 hover:text-white transition-all">
            <Icon d="M6 18L18 6M6 6l12 12" />
          </button>
        </div>

        {/* Search */}
        <div className="px-2 pb-2">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="text" value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} placeholder="Ara..."
              className="w-full pl-7 pr-2 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/70 placeholder:text-white/15 focus:outline-none focus:border-white/20 transition-colors" />
          </div>
        </div>

        {/* Photos Grid */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 grid grid-cols-2 gap-1.5 custom-scrollbar auto-rows-min">
          {photos
            .filter((p) => !librarySearch || (p.note || '').toLowerCase().includes(librarySearch.toLowerCase()) || (p.category || '').toLowerCase().includes(librarySearch.toLowerCase()))
            .map((p) => <DrawerPhotoItem key={p.id} photo={p} onClick={() => addPhoto(p)} />)}
          {photos.length === 0 && <div className="col-span-2 py-10 text-center text-[10px] text-white/15">No photos</div>}
        </div>

        {/* Sidebar Footer Icons */}
        <div className="p-2 border-t border-white/[0.04] flex items-center gap-1">
          <ToolBtn onClick={() => addPhoto} title="Photos"><Icon d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5" /></ToolBtn>
          <ToolBtn onClick={addSticky} title="Note"><Icon d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></ToolBtn>
          <ToolBtn onClick={() => addText()} title="Text"><Icon d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></ToolBtn>
          <ToolBtn onClick={handleExport} title="Export"><Icon d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></ToolBtn>
        </div>
      </div>

      {/* ── Main Area ── */}
      <div className="flex-1 relative">

      {/* ── Top Center Bar ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-xl bg-black/50 backdrop-blur-2xl border border-white/[0.06] shadow-2xl">
        <button onClick={() => { setShowCmd(true); setCmdQuery(''); }} className="p-1 text-white/25 hover:text-white transition-all"><Icon d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></button>
        <span className="text-[10px] text-white/30 font-medium">Ekipman</span>
        <div className="w-px h-4 bg-white/[0.06]" />
        <button onClick={selectAll} className="p-1 text-white/25 hover:text-white transition-all"><Icon d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></button>
        <button onClick={() => setShowBgPicker(!showBgPicker)} className={`p-1 transition-all ${showBgPicker ? 'text-indigo-400' : 'text-white/25 hover:text-white'}`}><Icon d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128z" /></button>
      </div>

      {/* ── Bottom Dock ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-black/50 backdrop-blur-2xl border border-white/[0.06] shadow-2xl">
        <ToolBtn onClick={() => setShowLibrary(!showLibrary)} title="Sidebar" active={showLibrary}><Icon d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></ToolBtn>

        <div className="w-px h-7 bg-white/[0.06] mx-0.5" />

        <ToolBtn onClick={() => addText()} title="Text"><Icon d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></ToolBtn>
        <ToolBtn onClick={addSticky} title="Sticky"><Icon d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></ToolBtn>
        <ToolBtn onClick={() => fitView({ duration: 600 })} title="Fit"><Icon d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></ToolBtn>

        <div className="w-px h-7 bg-white/[0.06] mx-0.5" />

        <ToolBtn onClick={deleteSelected} title="Delete" danger><Icon d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79" /></ToolBtn>
        <ToolBtn onClick={handleExport} title="Export"><Icon d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></ToolBtn>
        <ToolBtn onClick={clearCanvas} title="Clear" danger><Icon d="M6 18L18 6M6 6l12 12" /></ToolBtn>
      </div>


      {/* ── Background Color Picker Popup ── */}
      {showBgPicker && (
        <div className="fixed inset-0 z-50" onClick={() => setShowBgPicker(false)}>
          <div onClick={(e) => e.stopPropagation()} className="absolute bottom-24 right-8 p-4 rounded-xl bg-neutral-900/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] w-[220px]">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-3">Canvas Color</p>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {BG_COLORS.map((color) => (
                <button key={color} onClick={() => { setCanvasBg(color); setShowBgPicker(false); }}
                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${canvasBg === color ? 'border-indigo-400 scale-110 ring-2 ring-indigo-400/30' : 'border-white/10 hover:border-white/30'}`}
                  style={{ background: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <label className="text-[10px] text-white/30 font-medium">Custom</label>
              <input type="color" value={canvasBg} onChange={(e) => setCanvasBg(e.target.value)}
                className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none" />
              <span className="text-[10px] text-white/20 font-mono">{canvasBg}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Command Palette ── */}
      {showCmd && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]" onClick={() => setShowCmd(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md rounded-xl bg-neutral-900/95 backdrop-blur-2xl border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
              <Icon d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              <input value={cmdQuery} onChange={(e) => setCmdQuery(e.target.value)} placeholder="Type a command..." autoFocus className="flex-1 bg-transparent text-sm text-white/90 focus:outline-none placeholder:text-white/20" />
              <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/20 font-mono">ESC</kbd>
            </div>
            <div className="max-h-[300px] overflow-y-auto py-1">
              {filtered.map((c, i) => (
                <button key={i} onClick={c.action} className="w-full text-left px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">{c.label}</button>
              ))}
              {filtered.length === 0 && <div className="px-4 py-6 text-center text-xs text-white/20">No results</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Canvas ── */}
      <div className="w-full h-full relative">
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onNodeContextMenu={onNodeContextMenu}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver} onDrop={onDrop}
          nodeTypes={nodeTypes} edgeTypes={edgeTypes}
          fitView defaultEdgeOptions={{ type: 'custom' }}
          colorMode="dark" panOnScroll selectionOnDrag elevateNodesOnSelect
          style={{ background: canvasBg }}
          onEdgeDoubleClick={async (_, edge) => { if (await confirm('Delete this connection?')) setEdges((e) => e.filter((x) => x.id !== edge.id)); }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="rgba(255,255,255,0.08)" style={{ backgroundColor: 'transparent' }} />
          <MiniMap
            nodeStrokeWidth={3} zoomable pannable
            style={{ background: '#111', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}
            maskColor="rgba(0,0,0,0.7)"
          />
          <Controls showFitView={false} style={{ background: 'rgba(23,23,23,0.9)', borderColor: 'rgba(255,255,255,0.06)', fill: 'rgba(255,255,255,0.5)', borderRadius: '12px', overflow: 'hidden', backdropFilter: 'blur(10px)' }} />
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
  const [initialData, setInitialData] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);

  useEffect(() => {
    if (!canvasId) { setInitialData({ nodes: [], edges: [] }); return; }
    (async () => {
      const data = await getCanvas(canvasId);
      if (data) {
        const nodes = (data.nodes || []).map((n: any) => ({
          ...n,
          position: n.position || { x: n.x || 0, y: n.y || 0 },
          type: n.type || 'text',
          data: { ...n.data, ...(n.photoId && !n.data?.photoId ? { photoId: n.photoId } : {}), ...(n.text && !n.data?.text ? { text: n.text } : {}) },
        }));
        const edges = (data.edges || []).map((e: any) => e.fromNodeId && !e.source ? { ...e, source: e.fromNodeId, target: e.toNodeId, type: 'custom', data: { edgeType: 'smoothstep' } } : e);
        setInitialData({ nodes, edges });
      } else { setInitialData({ nodes: [], edges: [] }); }
    })();
  }, [canvasId]);

  if (!initialData) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return <ReactFlowProvider><FlowCanvas canvasId={canvasId} initialNodes={initialData.nodes} initialEdges={initialData.edges} /></ReactFlowProvider>;
}

export default function CanvasEditorPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}><CanvasEditorContent /></Suspense>;
}
