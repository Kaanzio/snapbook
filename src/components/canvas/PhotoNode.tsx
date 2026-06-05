import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { usePhotoImage } from '@/hooks/usePhotoImage';

export default function PhotoNode({ data, selected }: NodeProps) {
  const nodeData = data as { photoData?: { id: string, note?: string }, photoId?: string };
  const { imageUrl, loading } = usePhotoImage(nodeData.photoId || nodeData.photoData?.id || '');

  return (
    <div className="group relative w-full h-full">
      <NodeResizer
        isVisible={selected}
        minWidth={100}
        minHeight={100}
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

      <div className={`w-full h-full rounded-xl overflow-hidden transition-all duration-300 flex flex-col
        ${selected
          ? 'ring-2 ring-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.15)]'
          : 'shadow-xl shadow-black/30 ring-1 ring-white/[0.06]'
        }`}>

        {/* Image */}
        <div className="flex-1 relative bg-neutral-900 overflow-hidden">
          {(loading || !imageUrl) ? (
            <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
          ) : (
            <img
              src={imageUrl as string}
              alt="Photo"
              className="w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-[1.03]"
              draggable={false}
            />
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Caption bar */}
        {nodeData.photoData?.note && (
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out bg-black/80 backdrop-blur-sm">
            <p className="text-[11px] font-medium text-white/80 truncate">
              {nodeData.photoData.note}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
