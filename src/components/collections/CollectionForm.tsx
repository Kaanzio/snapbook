'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';

interface CollectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
  initialName?: string;
  initialDescription?: string;
  title?: string;
}

export default function CollectionForm({
  isOpen,
  onClose,
  onSubmit,
  initialName = '',
  initialDescription = '',
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
