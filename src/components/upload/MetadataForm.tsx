import { useCollections } from '@/hooks/useCollections';
import { useCategories } from '@/hooks/useCategories';
import { UploadFormData } from '@/types';
import { useState } from 'react';
import TagInput from '@/components/ui/TagInput';
import StarToggle from '@/components/ui/StarToggle';
import CustomCategoryModal from './CustomCategoryModal';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface MetadataFormProps {
  formData: UploadFormData;
  onChange: (data: UploadFormData) => void;
  onAiTagRequest?: () => void;
  isAiTagging?: boolean;
}

export default function MetadataForm({ formData, onChange, onAiTagRequest, isAiTagging }: MetadataFormProps) {
  const { categories } = useCategories();
  const { collections } = useCollections();
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  function update(partial: Partial<UploadFormData>) {
    onChange({ ...formData, ...partial });
  }

  function toggleCollection(id: string) {
    const ids = formData.collection_ids || [];
    if (ids.includes(id)) {
      update({ collection_ids: ids.filter(i => i !== id) });
    } else {
      update({ collection_ids: [...ids, id] });
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Button at the top */}
      {onAiTagRequest && (
        <button
          type="button"
          onClick={onAiTagRequest}
          disabled={isAiTagging}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all haptic-tap cursor-pointer disabled:opacity-50"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          {isAiTagging ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Yapay Zeka ile Analiz Ediliyor...
            </>
          ) : (
            <>
              ✨ Yapay Zeka ile Otomatik Doldur
            </>
          )}
        </button>
      )}

      {/* Category picker */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Kategori</label>
          <button 
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="text-xs font-bold text-accent hover:opacity-80 transition-opacity"
          >
            + Yeni Kategori
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => update({ category: cat.key })}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200 haptic-tap cursor-pointer
                ${formData.category === cat.key
                  ? 'bg-accent-soft shadow-sm'
                  : 'hover:bg-accent-soft/50'
                }`}
              style={{ 
                borderColor: formData.category === cat.key ? 'var(--accent)' : 'var(--border-primary)', 
                background: formData.category === cat.key ? 'var(--accent)' : 'var(--bg-card)' 
              }}
            >
              <CategoryIcon categoryKey={cat.key} className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: formData.category === cat.key ? 'var(--accent-foreground, white)' : 'var(--text-tertiary)' }}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Collections */}
      <div>
        <label className="block text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Koleksiyonlar</label>
        {collections.length === 0 ? (
          <p className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>Henüz koleksiyon oluşturmadınız.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {collections.map((coll) => {
              const isSelected = formData.collection_ids?.includes(coll.id);
              return (
                <button
                  key={coll.id}
                  type="button"
                  onClick={() => toggleCollection(coll.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all haptic-tap cursor-pointer
                    ${isSelected ? 'bg-accent text-white border-accent' : 'border-border-primary'}`}
                  style={{ 
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border-primary)',
                    background: isSelected ? 'var(--accent)' : 'var(--bg-card)',
                    color: isSelected ? 'var(--accent-foreground, white)' : 'var(--text-secondary)'
                  }}
                >
                  {coll.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Not</label>
        <textarea
          value={formData.note}
          onChange={(e) => update({ note: e.target.value })}
          placeholder="Bu fotoğraf hakkında bir not..."
          rows={3}
          className="w-full px-4 py-3 rounded-2xl themed-input text-sm resize-none"
        />
      </div>

      {/* Tags */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Etiketler</label>
        </div>
        <TagInput
          tags={formData.tags}
          onChange={(tags) => update({ tags })}
          placeholder="Etiket ekle (Enter ile)"
        />
      </div>

      {/* Starred + Location row */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <StarToggle
            starred={formData.is_starred}
            onChange={(is_starred) => update({ is_starred })}
            size="lg"
          />
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Favorilere Ekle</span>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.captureLocation}
            onChange={(e) => update({ captureLocation: e.target.checked })}
            className="w-4 h-4 rounded border-2"
            style={{ accentColor: 'var(--accent)' }}
          />
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Konum kaydet
          </span>
        </label>
      </div>
      {showCategoryModal && (
        <CustomCategoryModal 
          onClose={() => setShowCategoryModal(false)} 
          onSelect={(key) => update({ category: key })}
        />
      )}
    </div>
  );
}
