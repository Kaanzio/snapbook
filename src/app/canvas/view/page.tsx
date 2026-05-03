'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { getCanvas, saveCanvas, notifyDataChange } from '@/lib/indexeddb';
import { usePhotos } from '@/hooks/usePhotos';
import { PhotoMetadata } from '@/types';
import { showToast } from '@/components/ui/Toast';

import PhotoNode from '@/components/canvas/PhotoNode';
import TextNode from '@/components/canvas/TextNode';
import CustomEdge from '@/components/canvas/CustomEdge';
import CanvasContextMenu from '@/components/canvas/CanvasContextMenu';
import { usePhotoImage } from '@/hooks/usePhotoImage';

const nodeTypes = {
  photo: PhotoNode,
  text: TextNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

function DrawerPhotoItem({ photo, onClick }: { photo: PhotoMetadata, onClick: () => void }) {
  const { imageUrl } = usePhotoImage(photo.id, false);
  return (
    <div 
      onClick={onClick}
      className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative bg-slate-100 dark:bg-slate-800"
    >
      {imageUrl && <img src={imageUrl} alt="" className="w-full h-full object-cover" />}
    </div>
  );
}

function FlowCanvas({ 
  canvasId, 
  initialNodes, 
  initialEdges 
}: { 
  canvasId: string, 
  initialNodes: Node[], 
  initialEdges: Edge[] 
}) {
  const router = useRouter();
  const { photos } = usePhotos();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showPhotoDrawer, setShowPhotoDrawer] = useState(false);
  const [menu, setMenu] = useState<{ id: string; top?: number; left?: number; right?: number; bottom?: number } | null>(null);
  const { fitView, setEdges: updateEdges } = useReactFlow();

  // Initial cleanup
  useEffect(() => {
    setNodes((nds) => nds.map(n => {
      if (n.data && (n.data as any).onUpdate) {
        const { onUpdate, ...cleanData } = n.data as any;
        return { ...n, data: cleanData };
      }
      return n;
    }));
    
    setEdges((eds) => eds.map(e => {
      if (e.data && (e.data as any).onLabelUpdate) {
        const { onLabelUpdate, ...cleanData } = e.data as any;
        return { ...e, type: 'custom', data: cleanData };
      }
      return { ...e, type: 'custom' };
    }));
  }, []);

  // Save changes
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const data = await getCanvas(canvasId);
      if (data) {
        const updated = {
          ...data,
          nodes,
          edges,
          updated_at: new Date()
        };
        await saveCanvas(updated);
        notifyDataChange('canvases');
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [nodes, edges, canvasId]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ 
      ...params, 
      type: 'custom', 
      data: { edgeType: 'smoothstep' } 
    }, eds)),
    [setEdges]
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
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
    },
    [setMenu]
  );

  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

  const setEdgeType = useCallback((type: 'smoothstep' | 'step' | 'straight' | 'bezier') => {
    setEdges((eds) => eds.map((e) => {
      if (e.selected) {
        return { ...e, data: { ...e.data, edgeType: type } };
      }
      return e;
    }));
  }, [setEdges]);

  const addTextNode = () => {
    const newNode: Node = {
      id: uuidv4(),
      type: 'text',
      position: { x: window.innerWidth / 2 - 60, y: window.innerHeight / 2 - 40 },
      data: { text: 'Yeni Metin', isNew: true },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addPhotoNode = (photo: PhotoMetadata) => {
    if (nodes.some((n) => n.type === 'photo' && n.data.photoId === photo.id)) {
      showToast('Bu fotoğraf zaten canvas üzerinde', 'info');
      return;
    }

    const newNode: Node = {
      id: uuidv4(),
      type: 'photo',
      position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 },
      data: { photoId: photo.id, photoData: photo },
    };
    setNodes((nds) => nds.concat(newNode));
    setShowPhotoDrawer(false);
  };

  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, [setNodes, setEdges]);

  const selectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
    setEdges((eds) => eds.map((e) => ({ ...e, selected: true })));
  }, [setNodes, setEdges]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      }
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, selectAll]);

  return (
    <div className="h-screen flex flex-col page-enter overflow-hidden relative">
      <header className="h-14 shrink-0 flex items-center justify-between px-4 themed-header z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/canvas')} className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors haptic-tap" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Canvas</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={selectAll} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 haptic-tap" title="Tümünü Seç" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          </button>
          <button onClick={deleteSelected} className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 haptic-tap" title="Seçilenleri Sil">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
          <div className="w-px h-5 bg-slate-200 mx-1 dark:bg-slate-700" />
          <button onClick={() => fitView({ duration: 800 })} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 haptic-tap" title="Ekrana Sığdır" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          </button>
          <button onClick={addTextNode} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 haptic-tap" title="Metin Ekle" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12h-9m9 0l-3 3m3-3l-3-3M3 6h18M3 18h18" />
              <text x="7" y="16" fontSize="10" fontWeight="bold" fill="currentColor">T</text>
            </svg>
          </button>
          <button onClick={() => setShowPhotoDrawer(!showPhotoDrawer)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 haptic-tap" title="Fotoğraf Ekle" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v12a2.25 2.25 0 002.25 2.25zm13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 flex relative">
        <div className={`shrink-0 w-64 h-full border-r z-10 transition-all duration-300 absolute md:relative ${showPhotoDrawer ? 'left-0' : '-left-full hidden md:block md:-ml-64'}`}
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
          <div className="p-3 font-medium text-sm border-b" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}>
            Kitaplık
          </div>
          <div className="p-2 overflow-y-auto h-[calc(100%-45px)] grid grid-cols-2 gap-2">
            {photos.map(photo => (
              <DrawerPhotoItem key={photo.id} photo={photo} onClick={() => addPhotoNode(photo)} />
            ))}
            {photos.length === 0 && (
              <div className="col-span-2 p-4 text-center text-xs text-slate-400">
                Hiç fotoğraf yok
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 w-full h-full relative" style={{ background: 'var(--bg-secondary)' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            defaultEdgeOptions={{ type: 'custom' }}
          >
            <Background gap={20} size={1} color="var(--border-primary)" />
            <Controls 
              showFitView={false}
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', fill: 'var(--text-primary)' }} 
            />
            {menu && <CanvasContextMenu {...menu} onClose={() => setMenu(null)} />}
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

function CanvasEditorContent() {
  const searchParams = useSearchParams();
  const canvasId = searchParams.get('id') || '';
  const [initialData, setInitialData] = useState<{ nodes: Node[], edges: Edge[] } | null>(null);

  useEffect(() => {
    if (!canvasId) {
      setInitialData({ nodes: [], edges: [] });
      return;
    }

    async function load() {
      const data = await getCanvas(canvasId);
      if (data) {
        const migratedNodes = (data.nodes || []).map((node: any) => {
          const newNode = { ...node };
          if (!newNode.position) {
            newNode.position = { x: node.x || 0, y: node.y || 0 };
          }
          if (!newNode.type) newNode.type = 'text';
          if (!newNode.data) newNode.data = {};
          if (node.photoId && !newNode.data.photoId) newNode.data.photoId = node.photoId;
          if (node.text && !newNode.data.text) newNode.data.text = node.text;
          return newNode;
        });

        const migratedEdges = (data.edges || []).map((edge: any) => {
          if (edge.fromNodeId && !edge.source) {
            return {
              ...edge,
              source: edge.fromNodeId,
              target: edge.toNodeId,
              type: 'custom',
              data: { edgeType: 'smoothstep' }
            };
          }
          return edge;
        });

        setInitialData({ nodes: migratedNodes, edges: migratedEdges });
      } else {
        setInitialData({ nodes: [], edges: [] });
      }
    }
    load();
  }, [canvasId]);

  if (!initialData) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <ReactFlowProvider>
      <FlowCanvas canvasId={canvasId} initialNodes={initialData.nodes} initialEdges={initialData.edges} />
    </ReactFlowProvider>
  );
}

export default function CanvasEditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen skeleton" />}>
      <CanvasEditorContent />
    </Suspense>
  );
}
