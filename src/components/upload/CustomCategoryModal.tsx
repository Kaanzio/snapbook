'use client';

import { useState } from 'react';
import { saveCustomCategory, notifyDataChange } from '@/lib/indexeddb';
import { CategoryInfo } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  onClose: () => void;
  onSelect: (key: string) => void;
}

const PRESET_COLORS = [
  '#f97316', '#3b82f6', '#8b5cf6', '#eab308', '#ec4899', 
  '#14b8a6', '#ef4444', '#10b981', '#6366f1', '#22c55e', 
  '#d946ef', '#f59e0b', '#0ea5e9', '#64748b'
];

export default function CustomCategoryModal({ onClose, onSelect }: Props) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('✨');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  async function handleSave() {
    if (!name.trim() || !icon.trim()) return;

    const key = `custom_${uuidv4()}`;
    const newCategory: CategoryInfo = {
      key,
      label: name.trim(),
      icon: icon.trim(),
      color,
      isCustom: true
    };

    await saveCustomCategory(newCategory);
    notifyDataChange('categories');
    onSelect(key);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onClose} />
      
      <div className="relative w-full max-w-sm rounded-2xl p-5 shadow-xl animate-[modalIn_0.3s_ease-out]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Yeni Kategori</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Kategori Adı</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm themed-input"
              placeholder="Örn: Evcil Hayvanlar"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Emoji İkonu</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={2}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium themed-input"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Renk</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{ 
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 2px var(--bg-card), 0 0 0 4px ${c}` : 'none'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !icon.trim()}
            className="flex-1 py-2 rounded-xl text-sm font-medium btn-accent disabled:opacity-50"
          >
            Oluştur
          </button>
        </div>
      </div>
    </div>
  );
}
