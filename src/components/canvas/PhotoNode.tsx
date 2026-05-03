import { Handle, Position, NodeProps } from '@xyflow/react';
import { usePhotoImage } from '@/hooks/usePhotoImage';
import { useCategories } from '@/hooks/useCategories';

export default function PhotoNode({ data, selected }: NodeProps) {
  const nodeData = data as any;
  const { imageUrl, loading } = usePhotoImage(nodeData.photoData?.id || '');
  const { getCategoryInfo } = useCategories();
  
  const category = nodeData.photoData ? getCategoryInfo(nodeData.photoData.category) : null;

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      
      <div className={`w-48 bg-white dark:bg-slate-800 rounded-xl overflow-hidden transition-all
        ${selected ? 'ring-2 ring-indigo-500 shadow-xl' : 'shadow-sm border border-slate-200 dark:border-slate-700'}`}>
        
        {/* Image */}
        <div className="w-full aspect-square relative bg-slate-100 dark:bg-slate-900">
          {(loading || !imageUrl) ? (
            <div className="absolute inset-0 skeleton" />
          ) : null}
          {(!loading && imageUrl) ? (
            <img 
              src={imageUrl as string} 
              alt="Photo" 
              className="w-full h-full object-cover" 
              draggable={false} 
            />
          ) : null}
        </div>

        {/* Info */}
        {nodeData.photoData ? (
          <div className="p-3" style={{ background: 'var(--bg-card)' }}>
            <div className="flex items-center gap-2 mb-1">
              {category ? (
                <span className="text-xs" style={{ color: category.color }}>
                  {category.icon} {category.label}
                </span>
              ) : null}
            </div>
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {nodeData.photoData.note || 'İsimsiz Fotoğraf'}
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
