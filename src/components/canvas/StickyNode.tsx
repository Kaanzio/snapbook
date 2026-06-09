import { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow, NodeResizer } from '@xyflow/react';

const STICKY_COLORS = [
  { bg: '#fef3c7', text: '#92400e', name: 'amber' },
  { bg: '#dbeafe', text: '#1e40af', name: 'blue' },
  { bg: '#dcfce7', text: '#166534', name: 'green' },
  { bg: '#fce7f3', text: '#9d174d', name: 'pink' },
  { bg: '#f3e8ff', text: '#6b21a8', name: 'purple' },
] as const;

export default function StickyNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow();
  const nodeData = data as { isNew?: boolean; text?: string; colorIndex?: number; rotation?: number };
  const [isEditing, setIsEditing] = useState(nodeData.isNew || false);
  const [text, setText] = useState(nodeData.text || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const colorIndex = nodeData.colorIndex ?? 0;
  const color = STICKY_COLORS[colorIndex % STICKY_COLORS.length];

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, text, isNew: false } };
        }
        return node;
      })
    );
  }, [id, text, setNodes]);

  const cycleColor = () => {
    const next = (colorIndex + 1) % STICKY_COLORS.length;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, colorIndex: next } };
        }
        return node;
      })
    );
  };

  return (
    <div className="group relative w-full h-full">
      <NodeResizer
        isVisible={selected}
        minWidth={140}
        minHeight={100}
        lineStyle={{ borderColor: color.text, borderWidth: 1.5 }}
        handleStyle={{ width: 8, height: 8, background: color.text, borderRadius: '50%' }}
      />
      <Handle type="target" position={Position.Top} id="top-t" className={`!w-4 !h-4 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} style={{ background: color.text }} />
      <Handle type="source" position={Position.Top} id="top-s" className={`!w-4 !h-4 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} style={{ background: color.text }} />
      <Handle type="target" position={Position.Bottom} id="bot-t" className={`!w-4 !h-4 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} style={{ background: color.text }} />
      <Handle type="source" position={Position.Bottom} id="bot-s" className={`!w-4 !h-4 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} style={{ background: color.text }} />
      <Handle type="target" position={Position.Left} id="left-t" className={`!w-4 !h-4 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} style={{ background: color.text }} />
      <Handle type="source" position={Position.Left} id="left-s" className={`!w-4 !h-4 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} style={{ background: color.text }} />
      <Handle type="target" position={Position.Right} id="right-t" className={`!w-4 !h-4 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} style={{ background: color.text }} />
      <Handle type="source" position={Position.Right} id="right-s" className={`!w-4 !h-4 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} style={{ background: color.text }} />

      <div
        onDoubleClick={() => setIsEditing(true)}
        className={`w-full h-full p-4 transition-all duration-300 flex flex-col shadow-lg
          ${selected ? 'shadow-xl ring-2 scale-[1.02]' : 'hover:shadow-xl'}`}
        style={{
          background: color.bg,
          color: color.text,
          borderRadius: '2px',
          transform: `rotate(${(nodeData.rotation ?? 0)}deg)`,
        }}
      >
        {/* Color cycle dot */}
        <button
          onClick={cycleColor}
          className="absolute top-2 right-2 w-4 h-4 rounded-full opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
          style={{ background: color.text }}
        />

        {isEditing ? (
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Escape' && handleBlur()}
            className="w-full h-full bg-transparent resize-none focus:outline-none text-sm font-medium leading-relaxed"
            style={{ color: color.text }}
            placeholder="Write something..."
          />
        ) : (
          <p className="text-sm font-medium whitespace-pre-wrap cursor-text leading-relaxed flex-1">
            {text || 'Double-click to edit...'}
          </p>
        )}
      </div>
    </div>
  );
}
