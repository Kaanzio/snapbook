const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export function getTmdbApiKey(): string | undefined {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('snapbook_tmdb_api_key');
    if (localKey && localKey.trim() !== '') return localKey.trim();
  }
  return process.env.NEXT_PUBLIC_TMDB_API_KEY;
}

export interface TMDBResult {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string; // movie
  name?: string; // tv
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date?: string; // movie
  first_air_date?: string; // tv
  vote_average: number;
}

export interface TMDBDetails extends TMDBResult {
  runtime?: number; // movie duration in mins
  episode_run_time?: number[]; // tv duration
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres: { id: number; name: string }[];
  videos?: {
    results: {
      site: string;
      type: string;
      key: string;
      iso_639_1: string;
    }[];
  };
}

export async function searchTMDB(query: string): Promise<TMDBResult[]> {
  if (!query || query.trim() === '') return [];
  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    console.warn("TMDB API Key eksik!");
    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/search/multi?api_key=${apiKey}&language=tr-TR&query=${encodeURIComponent(query)}&page=1&include_adult=false`
    );
    const data = await response.json();
    
    // Filtreleme: Sadece film ve dizileri al (kişileri vs. atla)
    return (data.results || []).filter(
      (item: TMDBResult) => item.media_type === 'movie' || item.media_type === 'tv'
    );
  } catch (error) {
    console.error("TMDB Arama Hatası:", error);
    return [];
  }
}

export async function getTMDBDetails(id: number, type: 'movie' | 'tv'): Promise<TMDBDetails | null> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `${BASE_URL}/${type}/${id}?api_key=${apiKey}&language=tr-TR&append_to_response=videos&include_video_language=tr,en`
    );
    const data = await response.json();
    data.media_type = type; // Ensure media_type is present for details
    return data;
  } catch (error) {
    console.error("TMDB Detay Hatası:", error);
    return null;
  }
}

export function getTMDBImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${IMAGE_BASE_URL}${path}`;
}

export function getTMDBBackdropUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w780${path}`;
}
