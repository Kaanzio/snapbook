import React, { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

interface CanvasContextMenuProps {
  id: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  onClose: () => void;
}

export default function CanvasContextMenu({
  id, top, left, right, bottom, onClose,
}: CanvasContextMenuProps) {
  const { getNode, setNodes, addNodes, setEdges } = useReactFlow();

  const duplicateNode = useCallback(() => {
    const node = getNode(id);
    if (!node) return;
    addNodes({
      ...node,
      id: `${node.id}-copy-${Date.now()}`,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      selected: false,
    });
    onClose();
  }, [id, getNode, addNodes, onClose]);

  const deleteNode = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
    onClose();
  }, [id, setNodes, setEdges, onClose]);

  const bringToFront = useCallback(() => {
    setNodes((nds) => {
      const maxZ = Math.max(...nds.map((n) => n.zIndex || 0), 0);
      return nds.map((n) => (n.id === id ? { ...n, zIndex: maxZ + 1 } : n));
    });
    onClose();
  }, [id, setNodes, onClose]);

  const sendToBack = useCallback(() => {
    setNodes((nds) => {
      const minZ = Math.min(...nds.map((n) => n.zIndex || 0), 0);
      return nds.map((n) => (n.id === id ? { ...n, zIndex: minZ - 1 } : n));
    });
    onClose();
  }, [id, setNodes, onClose]);

  const items = [
    { label: 'Duplicate', icon: '⎘', action: duplicateNode },
    { label: 'Bring to Front', icon: '↑', action: bringToFront },
    { label: 'Send to Back', icon: '↓', action: sendToBack },
    { type: 'separator' as const },
    { label: 'Delete', icon: '⌫', action: deleteNode, danger: true },
  ];

  return (
    <div
      style={{ top, left, right, bottom }}
      className="fixed z-[100] min-w-[180px] py-1.5 rounded-lg bg-neutral-900/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-[fadeIn_0.1s_ease-out]"
      onClick={onClose}
    >
      {items.map((item, i) => {
        if ('type' in item && item.type === 'separator') {
          return <div key={i} className="h-px bg-white/5 my-1" />;
        }
        const menuItem = item as { label: string; icon: string; action: () => void; danger?: boolean };
        return (
          <button
            key={i}
            onClick={menuItem.action}
            className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center justify-between gap-4 transition-colors
              ${menuItem.danger
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
          >
            <span>{menuItem.label}</span>
            <span className="text-[10px] text-white/20">{menuItem.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
