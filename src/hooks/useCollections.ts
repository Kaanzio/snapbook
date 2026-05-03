'use client';

import { useState, useEffect } from 'react';
import { Collection } from '@/types';
import { getAllCollections } from '@/lib/indexeddb';

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const data = await getAllCollections();
        if (isMounted) {
          setCollections(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load collections from IndexedDB', err);
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('snapbook-collections-changed', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('snapbook-collections-changed', handleUpdate);
    };
  }, []);

  return { collections, loading, error: null };
}
