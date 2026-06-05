'use client';

import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="mb-4 animate-[float_3s_ease-in-out_infinite] opacity-40" style={{ color: 'var(--text-secondary)' }}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {description && (
        <p className="text-sm text-center max-w-xs mb-4" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      )}
      {action}
    </div>
  );
}
