'use client';

import { useEffect, useState } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isRendered) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={`relative w-full max-h-[85vh] flex flex-col rounded-t-2xl shadow-xl transition-transform duration-300 ease-out transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-primary)' }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2 w-full haptic-tap" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full opacity-50" style={{ background: 'var(--text-tertiary)' }} />
        </div>
        
        {/* Header */}
        {title && (
          <div className="px-4 pb-3 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-secondary)' }}>
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <button 
              onClick={onClose}
              className="p-2 rounded-full transition-colors haptic-tap hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto px-4 py-4 safe-area-bottom pb-32">
          {children}
        </div>
      </div>
    </div>
  );
}
