import React, { useState, useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  getBezierPath,
  getStraightPath,
  useReactFlow,
} from '@xyflow/react';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  label,
  selected,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(label as string || '');

  let edgePath = '';
  let labelX = 0;
  let labelY = 0;

  const edgeType = (data as any)?.edgeType || 'smoothstep';

  if (edgeType === 'straight') {
    [edgePath, labelX, labelY] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
  } else if (edgeType === 'step') {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 0,
    });
  } else if (edgeType === 'smoothstep') {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  }

  const onLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabelText(e.target.value);
  };

  const onLabelBlur = useCallback(() => {
    setIsEditing(false);
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === id) {
          return { ...edge, label: labelText };
        }
        return edge;
      })
    );
  }, [id, labelText, setEdges]);

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ 
          ...style, 
          stroke: selected ? 'var(--accent)' : 'var(--text-tertiary)',
          strokeWidth: selected ? 3 : 2,
          transition: 'stroke 0.2s, stroke-width 0.2s'
        }} 
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <input
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-indigo-400 shadow-lg text-[10px] focus:outline-none"
              style={{ color: 'var(--text-primary)' }}
              value={labelText}
              onChange={onLabelChange}
              onBlur={onLabelBlur}
              onKeyDown={(e) => e.key === 'Enter' && onLabelBlur()}
              autoFocus
            />
          ) : (
            <div 
              onDoubleClick={() => setIsEditing(true)}
              className={`px-2 py-1 rounded bg-white dark:bg-slate-900 border transition-all cursor-text
                ${labelText ? 'opacity-100' : 'opacity-0 hover:opacity-50'}
              `}
              style={{ 
                color: 'var(--text-secondary)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {labelText || 'Etiket...'}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
