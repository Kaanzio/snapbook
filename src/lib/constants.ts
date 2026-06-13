import { CategoryInfo } from '@/types';

export const CATEGORIES: CategoryInfo[] = [
  { key: 'food', label: 'Yemek', icon: '🍽️', color: '#f97316' },
  { key: 'document', label: 'Belge', icon: '📄', color: '#8b5cf6' },
  { key: 'inspiration', label: 'İlham', icon: '💡', color: '#eab308' },
  { key: 'memory', label: 'Anı', icon: '💭', color: '#ec4899' },
  { key: 'finance', label: 'Finans', icon: '💰', color: '#10b981' },
  { key: 'nature', label: 'Manzara', icon: '🌿', color: '#22c55e' },
  { key: 'recipe', label: 'Tarif', icon: '🍳', color: '#f59e0b' },
  { key: 'street', label: 'Sokak', icon: '🛣️', color: '#6366f1' },
  { key: 'other', label: 'Diğer', icon: '📌', color: '#64748b' },
];

export const getCategoryInfo = (key: string): CategoryInfo => {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[CATEGORIES.length - 1];
};

export const DB_NAME = 'snapbook-db';
export const DB_VERSION = 6; // Bump version for custom lists
export const PHOTO_STORE = 'photos';
export const META_STORE = 'photos_meta';
export const COLLECTION_STORE = 'collections';
export const CANVAS_STORE = 'canvases';
export const PREFS_STORE = 'preferences';
export const CATEGORY_STORE = 'categories';
export const WATCHLIST_STORE = 'watchlist';
export const WATCHLIST_CUSTOM_STORE = 'watchlist_custom';

export const THUMBNAIL_MAX_WIDTH = 400;
export const THUMBNAIL_QUALITY = 0.7;
