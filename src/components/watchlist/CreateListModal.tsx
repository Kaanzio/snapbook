'use client';

import { useState, useEffect, useRef } from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';

interface CreateListModalProps {
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function CreateListModal({ onClose, onSubmit }: CreateListModalProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { customLists, loading } = useWatchlist();

  useEffect(() => {
    // Escape key handling
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // Focus input on mount
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-[#1a1a1a] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-[modalUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Yeni Liste Oluştur</h2>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-white/60 mb-2">Liste Adı</label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Hafta Sonu İzlenecekler"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                required
              />
            </div>
            
            {!loading && customLists.length > 0 && (
              <div className="mb-6">
                <label className="block text-xs font-semibold tracking-wider uppercase text-white/40 mb-2.5">
                  Mevcut Listeler ({customLists.length})
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scrollbar">
                  {customLists.map(list => (
                    <span 
                      key={list.id} 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs font-medium cursor-default"
                    >
                      <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      {list.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus:ring-2 focus:ring-accent focus:outline-none"
                style={{ color: 'var(--text-secondary)' }}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-accent text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all haptic-tap cursor-pointer focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-[#1a1a1a] focus:outline-none disabled:cursor-not-allowed"
              >
                Oluştur
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
