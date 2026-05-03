import { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';

export default function TextNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow();
  const nodeData = data as any;
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(nodeData.text || 'Metin ekle...');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Auto-resize
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              text,
            },
          };
        }
        return node;
      })
    );
  }, [id, text, setNodes]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      handleBlur();
    }
  }

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      
      <div 
        onDoubleClick={() => setIsEditing(true)}
        className={`px-4 py-3 min-w-[120px] rounded-xl transition-all
          ${selected ? 'ring-2 ring-indigo-500 shadow-xl' : 'shadow-sm border'}
        `}
        style={{ 
          background: 'var(--bg-card)', 
          borderColor: selected ? 'var(--accent)' : 'var(--border-primary)'
        }}
      >
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent resize-none focus:outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap cursor-text" style={{ color: 'var(--text-primary)' }}>
            {text || 'Boş metin'}
          </p>
        )}
      </div>
    </>
  );
}
