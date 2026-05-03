'use client';

import { usePreferences } from '@/components/providers/PreferencesProvider';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  const { resolvedTheme } = usePreferences();
  const isDark = resolvedTheme === 'dark' || resolvedTheme === 'oled';
  const logoSrc = isDark ? '/logo-dark.svg' : '/logo-light.svg';

  return (
    <img 
      src={logoSrc} 
      alt="Snapbook Logo" 
      className={className}
      style={{ display: 'block' }}
    />
  );
}
