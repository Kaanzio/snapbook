'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePreferences } from '@/components/providers/PreferencesProvider';
import { ThemeMode, GridDensity, FontSize, ACCENT_PRESETS } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import { deleteCustomCategory, notifyDataChange, getStorageUsage, clearAllDatabase } from '@/lib/indexeddb';
import { showToast } from '@/components/ui/Toast';
import { useDialog } from '@/components/providers/DialogProvider';
import { exportAllData, importAllData } from '@/lib/backup';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

export default function SettingsPage() {
  const { prefs, updatePrefs, resolvedTheme } = usePreferences();
  const { confirm } = useDialog();
  const { allCategories } = useCategories();
  const [customHex, setCustomHex] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [storage, setStorage] = useState<{ used: number; total: number | null }>({ used: 0, total: null });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [tmdbKey, setTmdbKey] = useState('');
  const [isTmdbEnabled, setIsTmdbEnabled] = useState(true);

  useEffect(() => {
    getStorageUsage().then(setStorage);
    if (typeof window !== 'undefined') {
      setTmdbKey(localStorage.getItem('snapbook_tmdb_api_key') || '');
      setIsTmdbEnabled(localStorage.getItem('snapbook_tmdb_disabled') !== 'true');
    }
  }, []);

  const handleToggleTmdb = () => {
    const newState = !isTmdbEnabled;
    setIsTmdbEnabled(newState);
    if (typeof window !== 'undefined') {
      if (newState) {
        localStorage.removeItem('snapbook_tmdb_disabled');
      } else {
        localStorage.setItem('snapbook_tmdb_disabled', 'true');
      }
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!await confirm('Bu yedek dosyasını içe aktarmak istediğinize emin misiniz? Mevcut verilerle birleştirilecektir.')) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    try {
      await importAllData(file, (progress) => {
        setImportProgress(progress);
      });
      showToast('Yedek başarıyla içe aktarıldı! Sayfa yenileniyor...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      showToast('Yedek içe aktarılamadı. Dosya bozuk olabilir.', 'error');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleClearDatabase = async () => {
    if (!await confirm('DİKKAT: Cihazınızdaki tüm fotoğraflar, listeler ve ayarlar SİLİNECEKTİR. Bu işlem geri alınamaz! Tüm verileri silmek istediğinize emin misiniz?')) return;

    try {
      await clearAllDatabase();
      showToast('Tüm veriler başarıyla silindi.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      showToast('Veriler silinirken hata oluştu.', 'error');
    }
  };

  async function toggleCategoryVisibility(key: string) {
    const hidden = prefs.hiddenCategories || [];
    if (hidden.includes(key)) {
      updatePrefs({ hiddenCategories: hidden.filter(k => k !== key) });
    } else {
      updatePrefs({ hiddenCategories: [...hidden, key] });
    }
  }

  const themeOptions: { key: ThemeMode; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'system', label: 'Sistem', desc: 'İşletim sistemi ayarını takip eder', icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
      </svg>
    ) },
    { key: 'light', label: 'Açık', desc: 'Aydınlık tema', icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ) },
    { key: 'dark', label: 'Koyu', desc: 'Karanlık tema', icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>
    ) },
    { key: 'oled', label: 'OLED Siyah', desc: 'Saf siyah, pil tasarrufu', icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
      </svg>
    ) },
  ];

  const gridOptions: { key: GridDensity; label: string; desc: string }[] = [
    { key: 'comfortable', label: 'Rahat', desc: 'Geniş kartlar, daha az sütun' },
    { key: 'compact', label: 'Kompakt', desc: 'Küçük kartlar, daha çok sütun' },
    { key: 'large', label: 'Büyük', desc: 'Tam ekran galeri görünümü' },
  ];

  const fontOptions: { key: FontSize; label: string; size: string }[] = [
    { key: 'small', label: 'Küçük', size: '14px' },
    { key: 'medium', label: 'Orta', size: '16px' },
    { key: 'large', label: 'Büyük', size: '18px' },
  ];

  async function handleDeleteCategory(key: string, name: string) {
    if (await confirm(`"${name}" kategorisini kalıcı olarak silmek istediğinize emin misiniz?`)) {
      await deleteCustomCategory(key);
      notifyDataChange('categories');
      showToast('Kategori silindi');
    }
  }



  function getContrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#000000' : '#FFFFFF';
  }

  function handleCustomHex() {
    const hex = customHex.startsWith('#') ? customHex : `#${customHex}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      updatePrefs({ accentColor: hex });
      setShowCustomInput(false);
      setCustomHex('');
    }
  }

  return (
    <div className="min-h-screen page-enter">
      {/* Header */}
      <header className="sticky top-0 z-30 themed-header">
        <div className="px-4 lg:px-6 py-6 mb-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Ayarlar</h1>
          <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>Tema ve görünüm ayarları</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-8">
      
        {/* ==================== API INTEGRATION ==================== */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              TMDB API Entegrasyonu
            </h2>
            <button
              onClick={handleToggleTmdb}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${isTmdbEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute transition-all ${isTmdbEnabled ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
          
          <div className={`p-4 rounded-2xl transition-all ${isTmdbEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Snapbook, film ve dizi aramak için TMDB altyapısını kullanır. Eğer kendi API anahtarınızı buraya girerseniz, uygulama sadece <b>sizin cihazınızda</b> sizin şifrenizle çalışır.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="TMDB API Anahtarınızı yapıştırın..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm transition-all focus:ring-2 focus:ring-accent outline-none"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-secondary)' }}
                value={tmdbKey}
                onChange={(e) => {
                  setTmdbKey(e.target.value);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('snapbook_tmdb_api_key', e.target.value.trim());
                  }
                }}
                disabled={!isTmdbEnabled}
              />
              {tmdbKey ? (
                <button 
                  onClick={() => {
                    setTmdbKey('');
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('snapbook_tmdb_api_key');
                    }
                  }}
                  className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 haptic-tap whitespace-nowrap bg-red-500 text-white"
                  title="Şifreyi Sil"
                  disabled={!isTmdbEnabled}
                >
                  Şifreyi Sil
                </button>
              ) : (
                <a 
                  href="https://www.themoviedb.org/settings/api" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 haptic-tap whitespace-nowrap"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-secondary)' }}
                >
                  Şifre Al
                </a>
              )}
            </div>
            <p className="text-[10px] mt-2 opacity-60" style={{ color: 'var(--text-tertiary)' }}>
              Şifre tarayıcınızın gizli hafızasına kaydedilir, asla sunucuya veya başka bir yere gönderilmez.
            </p>
          </div>
        </section>

        {/* ==================== THEME ==================== */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
            </svg>
            Tema
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {themeOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => updatePrefs({ theme: opt.key })}
                className="text-left p-4 rounded-2xl transition-all duration-200 haptic-tap"
                style={{
                  background: prefs.theme === opt.key ? 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.1)' : 'var(--bg-card)',
                  border: prefs.theme === opt.key ? '2px solid var(--accent)' : '2px solid var(--border-primary)',
                }}
              >
                <span style={{ color: prefs.theme === opt.key ? 'var(--accent)' : 'var(--text-secondary)' }}>{opt.icon}</span>
                <p className="text-sm font-medium mt-2" style={{ color: prefs.theme === opt.key ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {opt.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{opt.desc}</p>
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Aktif tema: <span className="font-medium text-accent">{resolvedTheme === 'light' ? 'Açık' : resolvedTheme === 'dark' ? 'Koyu' : 'OLED Siyah'}</span>
          </p>
        </section>

        {/* ==================== ACCENT COLOR ==================== */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
            </svg>
            Vurgu Rengi
          </h2>
          <div className="flex flex-wrap gap-3 items-center">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => updatePrefs({ accentColor: preset.value })}
                className="relative w-10 h-10 rounded-xl transition-all duration-200 hover:scale-110 haptic-tap"
                style={{
                  background: preset.value,
                  boxShadow: prefs.accentColor === preset.value ? `0 0 0 3px var(--bg-primary), 0 0 0 5px ${preset.value}` : 'none',
                }}
                title={preset.name}
              >
                {prefs.accentColor === preset.value && (
                  <svg 
                    className="w-5 h-5 absolute inset-0 m-auto" 
                    style={{ color: getContrastColor(preset.value) }}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}

            {/* Custom color */}
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 haptic-tap"
              style={{
                background: 'var(--bg-tertiary)',
                border: '2px dashed var(--border-primary)',
              }}
              title="Özel renk"
            >
              <span className="text-lg">+</span>
            </button>
          </div>

          {showCustomInput && (
            <div className="mt-3 flex items-center gap-2" style={{ animation: 'slideDown 0.2s ease-out' }}>
              <input
                type="text"
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value)}
                placeholder="#FF5733"
                maxLength={7}
                className="flex-1 px-3 py-2 rounded-xl text-sm themed-input"
              />
              <button
                onClick={handleCustomHex}
                className="px-4 py-2 rounded-xl text-sm font-medium btn-accent"
              >
                Uygula
              </button>
            </div>
          )}
        </section>

        {/* ==================== GRID DENSITY ==================== */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Izgara Yoğunluğu
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {gridOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => updatePrefs({ gridDensity: opt.key })}
                className="text-center p-4 rounded-2xl transition-all duration-200 haptic-tap"
                style={{
                  background: prefs.gridDensity === opt.key ? 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.1)' : 'var(--bg-card)',
                  border: prefs.gridDensity === opt.key ? '2px solid var(--accent)' : '2px solid var(--border-primary)',
                }}
              >
                {/* Grid preview */}
                <div className="flex gap-1 justify-center mb-2">
                  {opt.key === 'comfortable' && (
                    <>
                      <div className="w-5 h-7 rounded" style={{ background: 'var(--border-primary)' }} />
                      <div className="w-5 h-5 rounded" style={{ background: 'var(--border-primary)' }} />
                    </>
                  )}
                  {opt.key === 'compact' && (
                    <>
                      <div className="w-3 h-4 rounded" style={{ background: 'var(--border-primary)' }} />
                      <div className="w-3 h-3 rounded" style={{ background: 'var(--border-primary)' }} />
                      <div className="w-3 h-5 rounded" style={{ background: 'var(--border-primary)' }} />
                    </>
                  )}
                  {opt.key === 'large' && (
                    <div className="w-12 h-8 rounded border border-dashed flex items-center justify-center" style={{ borderColor: 'var(--border-primary)' }}>
                      <div className="w-8 h-4 rounded-sm" style={{ background: 'var(--border-primary)' }} />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium" style={{ color: prefs.gridDensity === opt.key ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {opt.label}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* ==================== FONT SIZE ==================== */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            Yazı Boyutu
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {fontOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => updatePrefs({ fontSize: opt.key })}
                className="text-center p-4 rounded-2xl transition-all duration-200 haptic-tap"
                style={{
                  background: prefs.fontSize === opt.key ? 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.1)' : 'var(--bg-card)',
                  border: prefs.fontSize === opt.key ? '2px solid var(--accent)' : '2px solid var(--border-primary)',
                }}
              >
                <span className="font-semibold" style={{ fontSize: opt.size, color: prefs.fontSize === opt.key ? 'var(--accent)' : 'var(--text-primary)' }}>
                  Aa
                </span>
                <p className="text-xs font-medium mt-1" style={{ color: prefs.fontSize === opt.key ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {opt.label}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* ==================== CATEGORY MANAGEMENT ==================== */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
            Kategori Yönetimi
          </h2>
          <div className="space-y-2">
            {allCategories.map((cat) => {
              const isHidden = prefs.hiddenCategories?.includes(cat.key);
              return (
                <div 
                  key={cat.key} 
                  className={`flex items-center justify-between p-3 rounded-2xl transition-opacity ${isHidden ? 'opacity-50' : 'opacity-100'}`}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                      <CategoryIcon categoryKey={cat.key} className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: isHidden ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>{cat.label}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{cat.isCustom ? 'Özel Kategori' : 'Varsayılan'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => toggleCategoryVisibility(cat.key)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: isHidden ? 'var(--text-tertiary)' : 'var(--accent)' }}
                      title={isHidden ? 'Göster' : 'Gizle'}
                    >
                      {isHidden ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.822 7.822L21 21m-2.278-2.278L14.95 14.95M12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                    {cat.isCustom && (
                      <button 
                        onClick={() => handleDeleteCategory(cat.key, cat.label)}
                        className="p-2 text-red-500 hover:bg-red-50/10 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ==================== STORAGE & BACKUP ==================== */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 8.485-7.5 11.9-7.5 11.9s-7.5-3.415-7.5-11.9a7.5 7.5 0 1115 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
            Depolama ve Yedekleme
          </h2>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
              <div className="flex justify-between items-end mb-2">
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Depolama Kullanımı</p>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {(storage.used / (1024 * 1024)).toFixed(1)} MB 
                  {storage.total && ` / ${(storage.total / (1024 * 1024 * 1024)).toFixed(1)} GB`}
                </p>
              </div>
              {storage.total && (
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-500" 
                    style={{ width: `${Math.min(100, (storage.used / storage.total) * 100)}%` }} 
                  />
                </div>
              )}
            </div>

            <button
              onClick={async () => {
                setIsExporting(true);
                try {
                  await exportAllData();
                  showToast('Yedekleme dosyası hazırlandı');
                } catch (err) {
                  showToast('Yedekleme başarısız oldu', 'error');
                } finally {
                  setIsExporting(false);
                }
              }}
              disabled={isExporting || isImporting}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl font-medium transition-all haptic-tap disabled:opacity-50"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              )}
              {isExporting ? 'Yedek hazırlanıyor...' : 'Tüm Verileri Yedekle (.zip)'}
            </button>

            <Link
              href="/sync"
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl font-bold transition-all haptic-tap btn-accent shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              Cihazlar Arası Eşitle (P2P)
            </Link>

            <div className="relative">
              <input
                type="file"
                accept=".zip"
                onChange={handleImport}
                disabled={isExporting || isImporting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <button
                disabled={isExporting || isImporting}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl font-medium transition-all haptic-tap disabled:opacity-50"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              >
                {isImporting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span>İçe aktarılıyor... %{importProgress}</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span>Yedekten Geri Yükle (.zip)</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleClearDatabase}
              disabled={isExporting || isImporting}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl font-medium transition-all hover:bg-red-500/10 haptic-tap disabled:opacity-50"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: '#ef4444' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Tüm Verileri Sıfırla
            </button>
          </div>
        </section>

        {/* Info */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          <p className="text-xs flex items-start gap-2" style={{ color: 'var(--text-tertiary)' }}>
            <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 8.485-7.5 11.9-7.5 11.9s-7.5-3.415-7.5-11.9a7.5 7.5 0 1115 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
            Tüm tercihler otomatik olarak cihazınızda saklanır (IndexedDB). Hiçbir veri sunucuya gönderilmez.
          </p>
        </div>
      </div>
    </div>
  );
}
