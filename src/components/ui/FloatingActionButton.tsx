'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function FloatingActionButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show on add page or canvas pages
  if (pathname === '/add' || pathname.startsWith('/canvas/')) return null;

  return (
    <div className="lg:hidden">
      {/* FAB Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" style={{ animation: 'fadeIn 0.2s ease' }} />
        </div>
      )}

      {isOpen && (
        <div className="fixed bottom-[152px] right-5 z-50 flex flex-col gap-3 items-end" style={{ animation: 'slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <button
            onClick={() => { setIsOpen(false); router.push('/add'); }}
            className="flex items-center gap-3 haptic-tap"
          >
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
              Fotoğraf Ekle
            </span>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg btn-accent">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v12a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => { setIsOpen(false); router.push('/canvas'); }}
            className="flex items-center gap-3 haptic-tap"
          >
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
              Yeni Canvas
            </span>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg btn-accent">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fab btn-accent"
        style={{ animation: isOpen ? 'none' : 'springIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <svg
          className="w-6 h-6 text-white transition-transform duration-300"
          style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  );
}
