'use client';

import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { usePathname } from 'next/navigation';
import { usePreferences } from '@/components/providers/PreferencesProvider';

export default function TopBar() {
  const pathname = usePathname();
  const { prefs, updatePrefs } = usePreferences();
  
  if (pathname.startsWith('/canvas/view')) return null;
  
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 px-4 flex items-center justify-between transition-colors duration-300"
      style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-secondary)' }}>
      <Link href="/" className="flex items-center h-10">
        <Logo className="h-9 w-auto" />
      </Link>

      <div className="flex items-center gap-2">
        <Link 
          href="/sync"
          className="flex items-center justify-center w-9 h-9 text-accent bg-accent/10 rounded-full haptic-tap transition-all active:scale-95"
          title="Cihaz Eşitleme"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </Link>

        <Link 
          href="/settings"
          className="flex items-center justify-center w-9 h-9 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-black/5 dark:bg-white/5 rounded-full haptic-tap transition-all active:scale-95"
          title="Ayarlar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
        
        {prefs.pin && (
          <button 
            onClick={() => updatePrefs({ isLocked: true })} 
            className="flex items-center justify-center w-9 h-9 text-red-500 bg-red-500/10 rounded-full haptic-tap transition-transform active:scale-95"
            title="Uygulamayı Kilitle"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
