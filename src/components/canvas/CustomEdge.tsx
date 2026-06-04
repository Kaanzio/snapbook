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

  const edgeType = (data as Record<string, unknown>)?.edgeType as string || 'smoothstep';

  if (edgeType === 'straight') {
    [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  } else if (edgeType === 'step') {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 0,
    });
  } else if (edgeType === 'bezier') {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
    });
  } else {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
    });
  }

  const onLabelBlur = useCallback(() => {
    setIsEditing(false);
    setEdges((eds) =>
      eds.map((edge) => (edge.id === id ? { ...edge, label: labelText } : edge))
    );
  }, [id, labelText, setEdges]);

  const strokeColor = selected ? '#818cf8' : 'rgba(255,255,255,0.12)';

  return (
    <>
      {/* Glow effect for selected edges */}
      {selected && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: '#6366f1',
            strokeWidth: 6,
            filter: 'blur(4px)',
            opacity: 0.3,
          }}
        />
      )}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: selected ? 2 : 1.5,
          transition: 'stroke 0.3s, stroke-width 0.3s',
        }}
      />
      {/* Animated dash for selected */}
      {selected && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: '#818cf8',
            strokeWidth: 2,
            strokeDasharray: '6 4',
            strokeDashoffset: 0,
            animation: 'edgeFlow 1s linear infinite',
          }}
        />
      )}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <input
              className="px-2 py-1 rounded-md bg-neutral-900 border border-indigo-500/30 shadow-lg text-xs text-white focus:outline-none focus:border-indigo-400"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onBlur={onLabelBlur}
              onKeyDown={(e) => e.key === 'Enter' && onLabelBlur()}
              autoFocus
            />
          ) : (
            <div
              onDoubleClick={() => setIsEditing(true)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-text
                ${labelText
                  ? 'bg-neutral-900/90 text-white/70 border border-white/10 backdrop-blur-sm'
                  : 'opacity-0 hover:opacity-40 bg-neutral-900/50 text-white/30 border border-white/5'
                }`}
            >
              {labelText || 'label'}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
