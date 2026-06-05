'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DropZone from '@/components/upload/DropZone';
import MetadataForm from '@/components/upload/MetadataForm';
import { uploadPhoto } from '@/lib/storage';
import { showToast } from '@/components/ui/Toast';
import { UploadFormData } from '@/types';

export default function AddPage() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<UploadFormData>({
    category: 'other',
    note: '',
    tags: [],
    is_starred: false,
    collection_ids: [],
    captureLocation: false,
  });

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

      router.push('/');
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 themed-header">
        <div className="px-4 lg:px-6 py-6 mb-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Fotoğraf Ekle</h1>
          <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>Yeni fotoğraflar yükleyin</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-6">
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
                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden">
                  <img
                    src={url}
                    alt={`Önizleme ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center
                      opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
          <div className="themed-card p-5 animate-[fadeIn_0.3s_ease-out]">
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Fotoğraf Bilgileri</h2>
            <MetadataForm formData={formData} onChange={setFormData} />
          </div>
        )}

        {/* Upload button */}
        {selectedFiles.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3.5 rounded-xl btn-accent text-sm font-semibold
              disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6.364 1.636l-.707.707M21 12h-1m-1.636 6.364l-.707-.707M12 20v-1m-6.364-1.636l.707-.707M3 12h1m1.636-6.364l.707.707" />
                </svg>
                Yükleniyor...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                {selectedFiles.length === 1 ? 'Fotoğrafı Kaydet' : `${selectedFiles.length} Fotoğrafı Kaydet`}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
