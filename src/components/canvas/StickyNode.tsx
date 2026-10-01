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
        {/* Actions bar (Edit + Color cycle) */}
        <div className={`absolute top-2 right-2 flex items-center gap-1.5 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button
            onClick={() => setIsEditing(true)}
            className="w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ color: color.text, background: 'rgba(0,0,0,0.06)' }}
            title="Düzenle"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
          <button
            onClick={cycleColor}
            className="w-5 h-5 rounded-full border border-black/10 transition-all hover:scale-110"
            style={{ background: color.text }}
            title="Renk Değiştir"
          />
        </div>

        {isEditing ? (
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Escape' && handleBlur()}
            className="w-full h-full bg-transparent resize-none focus:outline-none text-sm font-medium leading-relaxed"
            style={{ color: color.text }}
            placeholder="Bir not yazın..."
          />
        ) : (
          <p onClick={() => selected && setIsEditing(true)} className="text-sm font-medium whitespace-pre-wrap cursor-text leading-relaxed flex-1">
            {text || 'Düzenlemek için dokunun...'}
          </p>
        )}
      </div>
    </div>
  );
}
