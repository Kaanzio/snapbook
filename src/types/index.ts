// Snapbook Type Definitions

export interface PhotoMetadata {
  id: string;
  category: PhotoCategory;
  note: string | null;
  tags: string[];
  is_starred: boolean;
  collection_ids: string[];
  latitude: number | null;
  longitude: number | null;
  device_name: string;
  created_at: Date;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  cover_photo_id?: string;
  created_at: Date;
}

export interface IndexedDBPhoto {
  id: string;
  blob: Blob;
  thumbnail: Blob;
  mimeType: string;
  size: number;
  storedAt: number;
}

export type PhotoCategory = string;

export interface CategoryInfo {
  key: string;
  label: string;
  icon: string;
  color: string;
  isCustom?: boolean;
}

export interface PhotoWithImage extends PhotoMetadata {
  thumbnailUrl: string | null;
  isLocal: boolean;
}

export interface UploadFormData {
  category: string;
  note: string;
  tags: string[];
  is_starred: boolean;
  collection_ids: string[];
  captureLocation: boolean;
}

export interface FilterState {
  category: string | 'all';
  starred: boolean | null;
  collectionId: string | null;
  searchQuery: string;
  tags: string[];
}

// ==================== THEME & CUSTOMIZATION ====================

export type ThemeMode = 'light' | 'dark' | 'oled' | 'system';
export type GridDensity = 'comfortable' | 'compact' | 'large';
export type FontSize = 'small' | 'medium' | 'large';

export const ACCENT_PRESETS = [
  { name: 'İndigo', value: '#6366f1' },
  { name: 'Mavi', value: '#3b82f6' },
  { name: 'Yeşil', value: '#10b981' },
  { name: 'Turuncu', value: '#f97316' },
  { name: 'Pembe', value: '#ec4899' },
  { name: 'Mor', value: '#8b5cf6' },
  { name: 'Kırık Beyaz', value: '#E0E0E0' },
  { name: 'Beyaz', value: '#FFFFFF' },
] as const;

export interface AppPreferences {
  theme: ThemeMode;
  accentColor: string;
  gridDensity: GridDensity;
  fontSize: FontSize;
  hiddenCategories: string[];
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'system',
  accentColor: '#6366f1',
  gridDensity: 'comfortable',
  fontSize: 'medium',
  hiddenCategories: [],
};

// ==================== CANVAS MODE ====================

export interface CanvasData {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  viewport: { x: number; y: number; zoom: number };
  coverPhotoId?: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export type CanvasNodeType = 'photo' | 'text';

export interface CanvasNode {
  id: string;
  type?: string; // 'photoNode', 'textNode'
  position: { x: number; y: number };
  data: {
    photoId?: string;
    text?: string;
    onDelete?: (id: string) => void;
    onUpdate?: (id: string, data: Record<string, unknown>) => void;
    photoData?: PhotoMetadata | null; // For display
  };
  width?: number;
  height?: number;
  selected?: boolean;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  label?: string | React.ReactNode;
  animated?: boolean;
}

// ==================== WATCHLIST (MOVIE/SERIES TRACKING) ====================

export type WatchItemType = 'movie' | 'series';
export type WatchStatus = 'watching' | 'completed' | 'planned' | 'dropped';

export interface CustomWatchList {
  id: string;
  name: string;
  created_at: Date;
}

export interface WatchItem {
  id: string;
  title: string;
  description?: string;
  type: WatchItemType;
  status: WatchStatus;
  rating?: number; // 1-10
  currentSeason?: number;
  currentEpisode?: number;
  totalSeasons?: number;
  totalEpisodes?: number;
  genre?: string;
  tags: string[];
  note?: string;
  listIds?: string[];
  created_at: Date;
  updated_at: Date;
}

export const WATCH_STATUS_INFO: Record<WatchStatus, { label: string; icon: string; color: string }> = {
  watching: { label: 'İzleniyor', icon: '▶️', color: '#3b82f6' },
  completed: { label: 'Tamamlandı', icon: '✅', color: '#10b981' },
  planned: { label: 'Planlandı', icon: '📋', color: '#f59e0b' },
  dropped: { label: 'Bırakıldı', icon: '⏹️', color: '#ef4444' },
};

export const WATCH_TYPE_INFO: Record<WatchItemType, { label: string; icon: string }> = {
  movie: { label: 'Film', icon: '🎬' },
  series: { label: 'Dizi', icon: '📺' },
};

export const GENRE_OPTIONS = [
  'Aksiyon', 'Macera', 'Animasyon', 'Komedi', 'Suç', 'Belgesel',
  'Drama', 'Fantastik', 'Korku', 'Müzikal', 'Gizem', 'Romantik',
  'Bilim Kurgu', 'Gerilim', 'Savaş', 'Western', 'Anime',
] as const;
