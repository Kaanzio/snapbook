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

      {prefs.pin && (
        <button 
          onClick={() => updatePrefs({ isLocked: true })} 
          className="p-2 text-red-500 bg-red-500/10 rounded-full haptic-tap transition-transform active:scale-95"
          title="Uygulamayı Kilitle"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </button>
      )}
    </header>
  );
}
