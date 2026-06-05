'use client';

import { usePreferences } from '@/components/providers/PreferencesProvider';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export default function Logo({ className = "h-8 w-auto", iconOnly = false }: LogoProps) {
  const { resolvedTheme } = usePreferences();
  const isDark = resolvedTheme === 'dark' || resolvedTheme === 'oled';
  const logoRed = '#e60000'; // Snapbook Marka Kırmızısı

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox={iconOnly ? "0 0 40 40" : "0 0 160 40"}
      className={className}
      style={{ display: 'block' }}
    >
      {/* İkon Arkaplanı: Sabit Marka Rengi (Kırmızı) */}
      <rect x="0" y="0" width="40" height="40" rx="9" fill={logoRed}/>
      
      {/* İkon detayları */}
      <rect x="6" y="9" width="10" height="18" rx="2" fill="rgba(255,255,255,0.7)"/>
      <rect x="20" y="9" width="10" height="18" rx="2" fill="rgba(255,255,255,0.9)"/>
      <rect x="16.5" y="9" width="3" height="18" rx="1" fill="rgba(255,255,255,0.5)"/>
      
      {/* Lens */}
      <circle cx="25" cy="16" r="5" fill="none" stroke={logoRed} strokeWidth="1.5"/>
      <circle cx="25" cy="16" r="2" fill={logoRed}/>
      
      {!iconOnly && (
        <text x="50" y="26" fontFamily="system-ui,-apple-system,sans-serif" fontSize="19" letterSpacing="-0.4">
          <tspan fontWeight="700" fill={isDark ? "#ffffff" : "#1A1A1A"}>snap</tspan>
          <tspan fontWeight="300" fill="#888">book</tspan>
        </text>
      )}
    </svg>
  );
}
