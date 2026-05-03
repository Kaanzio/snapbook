'use client';

import { useState } from 'react';
import { usePreferences } from '@/components/providers/PreferencesProvider';
import { ThemeMode, GridDensity, FontSize, ACCENT_PRESETS } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import { deleteCustomCategory, notifyDataChange } from '@/lib/indexeddb';
import { showToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const { prefs, updatePrefs, resolvedTheme } = usePreferences();
  const { allCategories } = useCategories();
  const [customHex, setCustomHex] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  async function toggleCategoryVisibility(key: string) {
    const hidden = prefs.hiddenCategories || [];
    if (hidden.includes(key)) {
      updatePrefs({ hiddenCategories: hidden.filter(k => k !== key) });
    } else {
      updatePrefs({ hiddenCategories: [...hidden, key] });
    }
  }

  const themeOptions: { key: ThemeMode; label: string; desc: string; icon: string }[] = [
    { key: 'system', label: 'Sistem', desc: 'İşletim sistemi ayarını takip eder', icon: '💻' },
    { key: 'light', label: 'Açık', desc: 'Aydınlık tema', icon: '☀️' },
    { key: 'dark', label: 'Koyu', desc: 'Karanlık tema', icon: '🌙' },
    { key: 'oled', label: 'OLED Siyah', desc: 'Saf siyah, pil tasarrufu', icon: '⚫' },
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

  async function handleDeleteCategory(key: string) {
    if (confirm('Bu özel kategoriyi kalıcı olarak silmek istediğinize emin misiniz?')) {
      await deleteCustomCategory(key);
      notifyDataChange('categories');
      showToast('Kategori silindi');
    }
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
        <div className="px-4 lg:px-6 py-4">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Ayarlar</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Tema ve görünüm ayarları</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-8">

        {/* ==================== THEME ==================== */}
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            🎨 Tema
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
                <span className="text-2xl">{opt.icon}</span>
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
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            🌈 Vurgu Rengi
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
                  <svg className="w-5 h-5 text-white absolute inset-0 m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            📐 Izgara Yoğunluğu
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
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            🔤 Yazı Boyutu
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
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            🏷️ Kategori Yönetimi
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
                    <span className="text-xl w-10 h-10 flex items-center justify-center rounded-xl" style={{ background: `${cat.color}15`, color: cat.color }}>
                      {cat.icon}
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
                        onClick={() => handleDeleteCategory(cat.key)}
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

        {/* Info */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            💾 Tüm tercihler otomatik olarak cihazınızda saklanır (IndexedDB). Hiçbir veri sunucuya gönderilmez.
          </p>
        </div>
      </div>
    </div>
  );
}
