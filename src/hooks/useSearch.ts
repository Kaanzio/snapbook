'use client';

import { useMemo } from 'react';
import { PhotoMetadata, FilterState } from '@/types';

export function useSearch(photos: PhotoMetadata[], filters: FilterState): PhotoMetadata[] {
  return useMemo(() => {
    let result = [...photos];

    // Filter by category
    if (filters.category !== 'all') {
      result = result.filter((p) => p.category === filters.category);
    }

    // Filter by starred
    if (filters.starred === true) {
      result = result.filter((p) => p.is_starred);
    }

    // Filter by collection
    if (filters.collectionId) {
      result = result.filter((p) =>
        p.collection_ids.includes(filters.collectionId!)
      );
    }

    // Filter by tags
    if (filters.tags.length > 0) {
      result = result.filter((p) =>
        filters.tags.some((tag) =>
          p.tags.some((pt) => pt.toLowerCase().includes(tag.toLowerCase()))
        )
      );
    }

    // Full-text search across notes and tags
    if (filters.searchQuery.trim()) {
      const tokens = filters.searchQuery
        .toLowerCase()
        .trim()
        .split(/\s+/);

      result = result.filter((photo) => {
        const noteText = (photo.note || '').toLowerCase();
        const tagTexts = photo.tags.map((t) => t.toLowerCase());
        const categoryText = photo.category.toLowerCase();

        return tokens.every((token) => {
          return (
            noteText.includes(token) ||
            tagTexts.some((t) => t.includes(token)) ||
            categoryText.includes(token)
          );
        });
      });
    }

    return result;
  }, [photos, filters]);
}
