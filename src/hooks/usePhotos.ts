'use client';

import { useState, useEffect } from 'react';
import { PhotoMetadata } from '@/types';
import { getAllPhotosMeta } from '@/lib/indexeddb';

export function usePhotos() {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const data = await getAllPhotosMeta();
        if (isMounted) {
          setPhotos(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load photos from IndexedDB', err);
        if (isMounted) setLoading(false);
      }
    }

    // Initial load
    loadData();

    // Listen for changes
    const handleUpdate = () => loadData();
    window.addEventListener('snapbook-photos-changed', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('snapbook-photos-changed', handleUpdate);
    };
  }, []);

  // No error or connected states needed since it's 100% local
  return { photos, loading, error: null, connected: true };
}
