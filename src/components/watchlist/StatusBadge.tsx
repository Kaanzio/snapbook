import { WatchStatus, WATCH_STATUS_INFO } from '@/types';

interface StatusBadgeProps {
  status: WatchStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StatusBadge({ status, size = 'sm', className = '' }: StatusBadgeProps) {
  const info = WATCH_STATUS_INFO[status];
  
  if (!info) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      } ${className}`}
      style={{
        backgroundColor: `${info.color}20`, // 20% opacity background
        color: info.color,
        border: `1px solid ${info.color}40`,
      }}
    >
      <span>{info.icon}</span>
      {info.label}
    </span>
  );
}
