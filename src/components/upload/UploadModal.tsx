'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DropZone from '@/components/upload/DropZone';
import MetadataForm from '@/components/upload/MetadataForm';
import { uploadPhoto } from '@/lib/storage';
import { showToast } from '@/components/ui/Toast';
import { UploadFormData } from '@/types';

interface UploadModalProps {
  onClose: () => void;
}

export default function UploadModal({ onClose }: UploadModalProps) {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isAiTagging, setIsAiTagging] = useState(false);
  const [formData, setFormData] = useState<UploadFormData>({
    category: 'other',
    note: '',
    tags: [],
    is_starred: false,
    collection_ids: [],
    captureLocation: false,
  });

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleFilesSelected = useCallback((files: File[]) => {
    setSelectedFiles(files);

    // Generate previews
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);

    return () => urls.forEach(URL.revokeObjectURL);
  }, []);

  const handleAiTag = async () => {
    if (previews.length === 0) return;
    setIsAiTagging(true);
    try {
      const response = await fetch(previews[0]);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const { aiManager } = await import('@/lib/ai');
          const { tags, category } = await aiManager.analyzeImage('new', base64Data);
          
          setFormData(prev => {
            const newTags = tags && tags.length > 0 ? Array.from(new Set([...prev.tags, ...tags])) : prev.tags;
            const newCategory = category || prev.category;
            return { ...prev, tags: newTags, category: newCategory };
          });

          if ((tags && tags.length > 0) || category) {
            showToast('Yapay Zeka analizi tamamlandı!');
          } else {
            showToast('Uygun etiket veya kategori bulunamadı.');
          }
        } catch (e: any) {
          console.error("AI Error:", e);
          showToast(`AI Hatası: ${e.message || 'Bilinmeyen hata'}`);
        }
        setIsAiTagging(false);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error(err);
      setIsAiTagging(false);
      showToast('Görsel okunurken hata oluştu.');
    }
  };

  async function handleUpload() {
    if (selectedFiles.length === 0) return;

    setUploading(true);

    try {
      for (const file of selectedFiles) {
        await uploadPhoto(file, formData);
      }

      showToast(
        selectedFiles.length === 1
          ? 'Fotoğraf yüklendi!'
          : `${selectedFiles.length} fotoğraf yüklendi!`
      );

      // Clean up previews
      previews.forEach(URL.revokeObjectURL);

      // Reset form
      setSelectedFiles([]);
      setPreviews([]);
      setFormData({
        category: 'other',
        note: '',
        tags: [],
        is_starred: false,
        collection_ids: [],
        captureLocation: false,
      });

      // Navigate back / close modal
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      showToast('Yükleme başarısız oldu', 'error');
    } finally {
      setUploading(false);
    }
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto animate-[fadeIn_0.3s_ease-out]"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto pointer-events-auto bg-white dark:bg-[#0A0A0A] sm:rounded-3xl rounded-t-3xl shadow-2xl animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)] flex flex-col">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Fotoğraf Ekle</h2>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Yeni anılar yakalayın</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full transition-all duration-300 haptic-tap shadow-sm hover:scale-105 active:scale-95 inline-flex items-center justify-center"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 space-y-6 flex-1">
          {/* Drop zone or preview */}
          {selectedFiles.length === 0 ? (
            <DropZone onFilesSelected={handleFilesSelected} disabled={uploading} />
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {selectedFiles.length} fotoğraf seçildi
                </p>
                <button
                  onClick={() => {
                    previews.forEach(URL.revokeObjectURL);
                    setSelectedFiles([]);
                    setPreviews([]);
                  }}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Tümünü temizle
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {previews.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: 'var(--border-primary)' }}>
                    <img
                      src={url}
                      alt={`Önizleme ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full backdrop-blur-md bg-white/20 text-white flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500/80 hover:scale-110 shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add more button */}
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.onchange = () => {
                      if (input.files) {
                        const newFiles = Array.from(input.files).filter((f) =>
                          f.type.startsWith('image/')
                        );
                        setSelectedFiles((prev) => [...prev, ...newFiles]);
                        setPreviews((prev) => [
                          ...prev,
                          ...newFiles.map((f) => URL.createObjectURL(f)),
                        ]);
                      }
                    };
                    input.click();
                  }}
                  className="aspect-square rounded-xl border-2 border-dashed flex items-center justify-center transition-colors hover:border-indigo-300"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-tertiary)' }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Metadata form */}
          {selectedFiles.length > 0 && (
            <div className="themed-card p-5 sm:p-6 rounded-3xl shadow-sm border animate-[fadeIn_0.3s_ease-out]" style={{ borderColor: 'var(--border-primary)' }}>
              <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Fotoğraf Bilgileri</h2>
              <MetadataForm
                formData={formData}
                onChange={setFormData}
                onAiTagRequest={handleAiTag}
                isAiTagging={isAiTagging}
              />
            </div>
          )}
        </div>

        {/* Sticky Footer Upload Button */}
        {selectedFiles.length > 0 && (
          <div className="sticky bottom-0 z-40 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-black/5 dark:border-white/5 p-4 sm:p-6">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-3.5 px-6 rounded-2xl btn-accent text-sm font-semibold
                disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] haptic-tap hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              {uploading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Yükleniyor...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                  {selectedFiles.length === 1 ? 'Fotoğrafı Kaydet' : `${selectedFiles.length} Fotoğrafı Kaydet`}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
