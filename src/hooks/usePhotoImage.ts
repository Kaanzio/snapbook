'use client';

import { useState, useEffect } from 'react';
import { getThumbnail, getPhoto, hasPhoto } from '@/lib/indexeddb';

export function usePhotoImage(id: string, fullResolution = false) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLocal, setIsLocal] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;

    async function loadImage() {
      try {
        const exists = await hasPhoto(id);
        if (cancelled) return;

        setIsLocal(exists);

        if (exists) {
          const blob = fullResolution
            ? await getPhoto(id)
            : await getThumbnail(id);

          if (cancelled) return;

          if (blob) {
            url = URL.createObjectURL(blob);
            setImageUrl(url);
          }
        }
      } catch (err) {
        console.error('Failed to load photo from IndexedDB:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadImage();

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, fullResolution]);

  return { imageUrl, isLocal, loading };
}
