'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';

interface CollectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
  initialName?: string;
  initialDescription?: string;
  onSelectCover?: () => void;
  title?: string;
}

export default function CollectionForm({
  isOpen,
  onClose,
  onSubmit,
  initialName = '',
  initialDescription = '',
  onSelectCover,
  title = 'Yeni Koleksiyon',
}: CollectionFormProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), description.trim());
      setName('');
      setDescription('');
      onClose();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Koleksiyon Adı</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Yaz Tatili 2024"
            className="w-full px-4 py-2.5 rounded-xl border themed-input text-sm"
            style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Açıklama (isteğe bağlı)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Bu koleksiyon hakkında kısa bir açıklama..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border themed-input text-sm resize-none"
            style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}
          />
        </div>

        {onSelectCover && (
          <div className="pt-2">
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Kapak Fotoğrafı</label>
            <button
              type="button"
              onClick={onSelectCover}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-accent/40 bg-accent/5 text-accent text-sm font-bold hover:bg-accent/10 transition-all haptic-tap cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v12a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Kapak Fotoğrafını Değiştir
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: 'var(--text-tertiary)' }}
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="px-5 py-2 rounded-xl text-sm font-medium btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initialName ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
