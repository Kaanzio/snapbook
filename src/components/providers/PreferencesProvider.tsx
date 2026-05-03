'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppPreferences, ThemeMode, GridDensity, FontSize, DEFAULT_PREFERENCES } from '@/types';
import { getPreferences, savePreferences, notifyDataChange } from '@/lib/indexeddb';

interface PreferencesContextValue {
  prefs: AppPreferences;
  resolvedTheme: 'light' | 'dark' | 'oled';
  updatePrefs: (updates: Partial<AppPreferences>) => void;
  accentHSL: { h: number; s: number; l: number };
}

const PreferencesContext = createContext<PreferencesContextValue>({
  prefs: DEFAULT_PREFERENCES,
  resolvedTheme: 'light',
  updatePrefs: () => {},
  accentHSL: { h: 239, s: 84, l: 67 },
});

export function usePreferences() {
  return useContext(PreferencesContext);
}

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getContrastColor(hex: string): string {
  // Simple luminance check to decide between black and white text
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000000' : '#FFFFFF';
}

export default function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Load preferences from IndexedDB
  useEffect(() => {
    getPreferences().then((p) => {
      setPrefs(p);
      setLoaded(true);
    });
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mq.matches ? 'dark' : 'light');
    
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedTheme = prefs.theme === 'system' ? systemTheme : (prefs.theme as 'light' | 'dark' | 'oled');
  const accentHSL = hexToHSL(prefs.accentColor);
  const accentForeground = getContrastColor(prefs.accentColor);

  // Apply theme to document
  useEffect(() => {
    if (!loaded) return;
    const html = document.documentElement;
    
    // Remove old theme classes
    html.classList.remove('theme-light', 'theme-dark', 'theme-oled');
    html.classList.add(`theme-${resolvedTheme}`);

    // Set accent color CSS custom properties
    html.style.setProperty('--accent-h', String(accentHSL.h));
    html.style.setProperty('--accent-s', `${accentHSL.s}%`);
    html.style.setProperty('--accent-l', `${accentHSL.l}%`);
    html.style.setProperty('--accent', prefs.accentColor);
    html.style.setProperty('--accent-foreground', accentForeground);

    // Set font size
    const fontSizeMap: Record<FontSize, string> = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    html.style.setProperty('--base-font-size', fontSizeMap[prefs.fontSize]);

    // Set meta theme-color
    const themeColorMap: Record<string, string> = {
      light: '#ffffff',
      dark: '#1a1a2e',
      oled: '#000000',
    };
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', themeColorMap[resolvedTheme]);
    }
  }, [resolvedTheme, prefs.accentColor, prefs.fontSize, accentHSL, loaded]);

  const updatePrefs = useCallback((updates: Partial<AppPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...updates };
      savePreferences(next);
      notifyDataChange('preferences');
      return next;
    });
  }, []);

  return (
    <PreferencesContext.Provider value={{ prefs, resolvedTheme, updatePrefs, accentHSL }}>
      {children}
    </PreferencesContext.Provider>
  );
}
