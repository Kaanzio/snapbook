'use client';

import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export default function TopBar() {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 px-4 flex items-center transition-colors duration-300"
      style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-secondary)' }}>
      <Link href="/" className="flex items-center h-10">
        <Logo className="h-9 w-auto" />
      </Link>
    </header>
  );
}
