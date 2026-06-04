/**
 * SNAPBOOK LOCAL DATA STORAGE
 * 
 * All user data (photos, metadata, collections, and preferences) is stored 
 * exclusively in IndexedDB on the local device. 
 * 
 * - NO external API calls for data synchronization.
 * - NO tracking or analytics scripts.
 * - NO third-party cloud storage.
 * 
 * Your photos never leave your device.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, PHOTO_STORE, META_STORE, COLLECTION_STORE, CANVAS_STORE, PREFS_STORE, CATEGORY_STORE, WATCHLIST_STORE, WATCHLIST_CUSTOM_STORE, THUMBNAIL_MAX_WIDTH, THUMBNAIL_QUALITY } from './constants';
import { PhotoMetadata, Collection, CanvasData, AppPreferences, DEFAULT_PREFERENCES, CategoryInfo, WatchItem, CustomWatchList } from '@/types';

interface SnapbookDB extends DBSchema {
  [PHOTO_STORE]: {
    key: string;
    value: {
      id: string;
      blob: Blob;
      thumbnail: Blob;
      mimeType: string;
      size: number;
      storedAt: number;
    };
  };
  [META_STORE]: {
    key: string;
    value: PhotoMetadata;
    indexes: { 'by-created': number };
  };
  [COLLECTION_STORE]: {
    key: string;
    value: Collection;
    indexes: { 'by-created': number };
  };
  [CANVAS_STORE]: {
    key: string;
    value: CanvasData;
    indexes: { 'by-updated': number };
  };
  [PREFS_STORE]: {
    key: string;
    value: { key: string; data: AppPreferences };
  };
  [CATEGORY_STORE]: {
    key: string;
    value: CategoryInfo;
  };
  [WATCHLIST_STORE]: {
    key: string;
    value: WatchItem;
    indexes: { 'by-updated': number };
  };
  [WATCHLIST_CUSTOM_STORE]: {
    key: string;
    value: CustomWatchList;
    indexes: { 'by-created': number };
  };
}

let dbPromise: Promise<IDBPDatabase<SnapbookDB>> | null = null;

function getDB(): Promise<IDBPDatabase<SnapbookDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SnapbookDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(PHOTO_STORE)) {
          db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          const metaStore = db.createObjectStore(META_STORE, { keyPath: 'id' });
          metaStore.createIndex('by-created', 'created_at');
        }
        if (!db.objectStoreNames.contains(COLLECTION_STORE)) {
          const collStore = db.createObjectStore(COLLECTION_STORE, { keyPath: 'id' });
          collStore.createIndex('by-created', 'created_at');
        }
        if (!db.objectStoreNames.contains(CANVAS_STORE)) {
          const canvasStore = db.createObjectStore(CANVAS_STORE, { keyPath: 'id' });
          canvasStore.createIndex('by-updated', 'updated_at');
        }
        if (!db.objectStoreNames.contains(PREFS_STORE)) {
          db.createObjectStore(PREFS_STORE, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(CATEGORY_STORE)) {
          db.createObjectStore(CATEGORY_STORE, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(WATCHLIST_STORE)) {
          const watchStore = db.createObjectStore(WATCHLIST_STORE, { keyPath: 'id' });
          watchStore.createIndex('by-updated', 'updated_at');
        }
        if (!db.objectStoreNames.contains(WATCHLIST_CUSTOM_STORE)) {
          const watchCustomStore = db.createObjectStore(WATCHLIST_CUSTOM_STORE, { keyPath: 'id' });
          watchCustomStore.createIndex('by-created', 'created_at');
        }
      },
    });
  }
  return dbPromise;
}

// Generate a thumbnail from an image file
export async function generateThumbnail(file: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      let width = img.width;
      let height = img.height;

      if (width > THUMBNAIL_MAX_WIDTH) {
        height = Math.round((height * THUMBNAIL_MAX_WIDTH) / width);
        width = THUMBNAIL_MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to generate thumbnail'));
        },
        'image/jpeg',
        THUMBNAIL_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

// Save a photo binary to IndexedDB
export async function savePhoto(id: string, file: File | Blob): Promise<void> {
  const db = await getDB();
  const thumbnail = await generateThumbnail(file);

  await db.put(PHOTO_STORE, {
    id,
    blob: file,
    thumbnail,
    mimeType: file.type || 'image/jpeg',
    size: file.size,
    storedAt: Date.now(),
  });
}

// Get full-resolution photo
export async function getPhoto(id: string): Promise<Blob | null> {
  const db = await getDB();
  const record = await db.get(PHOTO_STORE, id);
  return record?.blob || null;
}

// Get thumbnail
export async function getThumbnail(id: string): Promise<Blob | null> {
  const db = await getDB();
  const record = await db.get(PHOTO_STORE, id);
  return record?.thumbnail || null;
}

// Check if photo exists locally
export async function hasPhoto(id: string): Promise<boolean> {
  const db = await getDB();
  const record = await db.get(PHOTO_STORE, id);
  return !!record;
}

// Delete photo binary from IndexedDB
export async function deleteLocalPhoto(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(PHOTO_STORE, id);
}

// Get all local photo IDs
export async function getAllLocalPhotoIds(): Promise<string[]> {
  const db = await getDB();
  return db.getAllKeys(PHOTO_STORE);
}

// Get storage usage estimate
export async function getStorageUsage(): Promise<{ used: number; total: number | null }> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      total: estimate.quota || null,
    };
  }
  return { used: 0, total: null };
}

// ==================== METADATA CRUD ====================

export async function getAllPhotosMeta(): Promise<PhotoMetadata[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex(META_STORE, 'by-created');
  // Return sorted descending by created_at
  return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createPhotoMetadata(photo: PhotoMetadata): Promise<void> {
  const db = await getDB();
  await db.put(META_STORE, photo);
}

export async function updatePhotoMetadata(id: string, updates: Partial<Omit<PhotoMetadata, 'id' | 'created_at'>>): Promise<void> {
  const db = await getDB();
  const existing = await db.get(META_STORE, id);
  if (existing) {
    await db.put(META_STORE, { ...existing, ...updates });
  }
}

export async function getPhotoMetadata(id: string): Promise<PhotoMetadata | null> {
  const db = await getDB();
  const meta = await db.get(META_STORE, id);
  return meta || null;
}

export async function deletePhotoMetadata(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(META_STORE, id);
}

// ==================== COLLECTIONS CRUD ====================

export async function getAllCollections(): Promise<Collection[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex(COLLECTION_STORE, 'by-created');
  // Return sorted descending by created_at
  return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createCollection(coll: Collection): Promise<void> {
  const db = await getDB();
  await db.put(COLLECTION_STORE, coll);
}

export async function updateCollection(id: string, updates: Partial<Omit<Collection, 'id' | 'created_at'>>): Promise<void> {
  const db = await getDB();
  const existing = await db.get(COLLECTION_STORE, id);
  if (existing) {
    await db.put(COLLECTION_STORE, { ...existing, ...updates });
  }
}

export async function deleteCollection(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(COLLECTION_STORE, id);
}

// ==================== CANVAS CRUD ====================

export async function getAllCanvases(): Promise<CanvasData[]> {
  const db = await getDB();
  const all = await db.getAll(CANVAS_STORE);
  return all.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function getCanvas(id: string): Promise<CanvasData | null> {
  const db = await getDB();
  const canvas = await db.get(CANVAS_STORE, id);
  return canvas || null;
}

export async function saveCanvas(canvas: CanvasData): Promise<void> {
  const db = await getDB();
  await db.put(CANVAS_STORE, canvas);
}

export async function deleteCanvas(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(CANVAS_STORE, id);
}

// ==================== PREFERENCES ====================

const PREFS_KEY = 'user_prefs';

export async function getPreferences(): Promise<AppPreferences> {
  const db = await getDB();
  const record = await db.get(PREFS_STORE, PREFS_KEY);
  return record?.data || { ...DEFAULT_PREFERENCES };
}

export async function savePreferences(prefs: AppPreferences): Promise<void> {
  const db = await getDB();
  await db.put(PREFS_STORE, { key: PREFS_KEY, data: prefs });
}

// ==================== CUSTOM CATEGORIES ====================

export async function getCustomCategories(): Promise<CategoryInfo[]> {
  try {
    const db = await getDB();
    if (!db.objectStoreNames.contains(CATEGORY_STORE)) return [];
    return await db.getAll(CATEGORY_STORE);
  } catch (error) {
    console.error('Error fetching custom categories:', error);
    return [];
  }
}

export async function saveCustomCategory(category: CategoryInfo): Promise<void> {
  const db = await getDB();
  await db.put(CATEGORY_STORE, category);
}

export async function deleteCustomCategory(key: string): Promise<void> {
  const db = await getDB();
  await db.delete(CATEGORY_STORE, key);
}

// Subscribe/Listen equivalents for hooks
// Since IndexedDB doesn't have real-time listeners, we dispatch custom window events
export function notifyDataChange(type: 'photos' | 'collections' | 'canvases' | 'preferences' | 'categories' | 'watchlist') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(`snapbook-${type}-changed`));
  }
}

// ==================== WATCHLIST CRUD ====================

export async function getAllWatchItems(): Promise<WatchItem[]> {
  const db = await getDB();
  const all = await db.getAll(WATCHLIST_STORE);
  return all.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function getWatchItem(id: string): Promise<WatchItem | null> {
  const db = await getDB();
  const item = await db.get(WATCHLIST_STORE, id);
  return item || null;
}

export async function createWatchItem(item: WatchItem): Promise<void> {
  const db = await getDB();
  await db.put(WATCHLIST_STORE, item);
}

export async function updateWatchItem(id: string, updates: Partial<Omit<WatchItem, 'id' | 'created_at'>>): Promise<void> {
  const db = await getDB();
  const existing = await db.get(WATCHLIST_STORE, id);
  if (existing) {
    await db.put(WATCHLIST_STORE, { ...existing, ...updates, updated_at: new Date() });
  }
}

export async function deleteWatchItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(WATCHLIST_STORE, id);
}

// ==================== WATCHLIST CUSTOM LISTS CRUD ====================

export async function getAllCustomLists(): Promise<CustomWatchList[]> {
  const db = await getDB();
  if (!db.objectStoreNames.contains(WATCHLIST_CUSTOM_STORE)) return [];
  const all = await db.getAllFromIndex(WATCHLIST_CUSTOM_STORE, 'by-created');
  return all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function createCustomList(list: CustomWatchList): Promise<void> {
  const db = await getDB();
  await db.put(WATCHLIST_CUSTOM_STORE, list);
}

export async function updateCustomList(id: string, name: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get(WATCHLIST_CUSTOM_STORE, id);
  if (existing) {
    await db.put(WATCHLIST_CUSTOM_STORE, { ...existing, name });
  }
}

export async function deleteCustomList(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(WATCHLIST_CUSTOM_STORE, id);
}

// ==================== DATABASE MAINTENANCE ====================

export async function clearAllDatabase(): Promise<void> {
  const db = await getDB();
  await db.clear(PHOTO_STORE);
  await db.clear(META_STORE);
  await db.clear(COLLECTION_STORE);
  await db.clear(CANVAS_STORE);
  await db.clear(PREFS_STORE);
  await db.clear(CATEGORY_STORE);
  await db.clear(WATCHLIST_STORE);
  if (db.objectStoreNames.contains(WATCHLIST_CUSTOM_STORE)) {
    await db.clear(WATCHLIST_CUSTOM_STORE);
  }
}
