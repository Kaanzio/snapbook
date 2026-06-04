import { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow, NodeResizer } from '@xyflow/react';

export default function TextNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow();
  const nodeData = data as Record<string, any>;
  const [isEditing, setIsEditing] = useState(nodeData.isNew || false);
  const [text, setText] = useState(nodeData.text || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  function updateStyle(updates: Record<string, unknown>) {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...updates } };
        }
        return node;
      })
    );
  }

  const variant = nodeData.variant || 'glass';
  const fontSize = nodeData.fontSize || 'text-base';

  const variantStyles: Record<string, string> = {
    glass: 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-white/90',
    solid: 'bg-neutral-800 border border-neutral-700 text-white/90',
    ghost: 'bg-transparent border border-dashed border-white/10 text-white/60',
    accent: 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-200',
  };

  return (
    <div className="group relative w-full h-full">
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={48}
        lineStyle={{ borderColor: '#6366f1', borderWidth: 1.5 }}
        handleStyle={{ width: 8, height: 8, background: '#6366f1', borderRadius: '50%' }}
      />
      <Handle type="target" position={Position.Top} id="top-t" className={`!w-2.5 !h-2.5 !bg-indigo-400 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} />
      <Handle type="source" position={Position.Top} id="top-s" className={`!w-2.5 !h-2.5 !bg-indigo-400 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} />
      <Handle type="target" position={Position.Bottom} id="bot-t" className={`!w-2.5 !h-2.5 !bg-indigo-400 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} />
      <Handle type="source" position={Position.Bottom} id="bot-s" className={`!w-2.5 !h-2.5 !bg-indigo-400 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} />
      <Handle type="target" position={Position.Left} id="left-t" className={`!w-2.5 !h-2.5 !bg-indigo-400 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} />
      <Handle type="source" position={Position.Left} id="left-s" className={`!w-2.5 !h-2.5 !bg-indigo-400 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} />
      <Handle type="target" position={Position.Right} id="right-t" className={`!w-2.5 !h-2.5 !bg-indigo-400 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} />
      <Handle type="source" position={Position.Right} id="right-s" className={`!w-2.5 !h-2.5 !bg-indigo-400 !border-none transition-opacity z-50 ${selected ? '!opacity-100' : '!opacity-0 group-hover:!opacity-100'}`} />

      {/* Style toolbar */}
      {selected && !isEditing && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-0.5 p-1 rounded-lg bg-neutral-900/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50">
          {(['text-xs', 'text-base', 'text-2xl'] as const).map((size, i) => (
            <button
              key={size}
              onClick={() => updateStyle({ fontSize: size })}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${fontSize === size ? 'bg-indigo-500 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              {['S', 'M', 'L'][i]}
            </button>
          ))}
          <div className="w-px h-4 bg-white/10 mx-1" />
          {Object.keys(variantStyles).map((v) => (
            <button
              key={v}
              onClick={() => updateStyle({ variant: v })}
              className={`w-5 h-5 rounded border transition-all ${variant === v ? 'border-indigo-400 scale-110' : 'border-white/10'}`}
              style={{
                background: v === 'glass' ? 'rgba(255,255,255,0.06)' :
                  v === 'solid' ? '#262626' :
                  v === 'ghost' ? 'transparent' :
                  'rgba(99,102,241,0.15)',
              }}
            />
          ))}
        </div>
      )}

      <div
        onDoubleClick={() => setIsEditing(true)}
        className={`w-full h-full px-5 py-3 rounded-xl transition-all duration-300 flex items-center
          ${variantStyles[variant] || variantStyles.glass}
          ${selected ? 'ring-2 ring-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : ''}`}
      >
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Escape' && handleBlur()}
            className={`w-full bg-transparent resize-none focus:outline-none leading-relaxed ${fontSize}`}
            placeholder="Type here..."
          />
        ) : (
          <p className={`w-full whitespace-pre-wrap cursor-text leading-relaxed ${fontSize}`}>
            {text || 'Double-click to edit...'}
          </p>
        )}
      </div>
    </div>
  );
}
