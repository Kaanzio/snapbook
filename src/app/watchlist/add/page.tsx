'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useWatchlist } from '@/hooks/useWatchlist';
import { WatchItemType, WatchStatus, WATCH_STATUS_INFO, WATCH_TYPE_INFO, GENRE_OPTIONS } from '@/types';
import { showToast } from '@/components/ui/Toast';
import TagInput from '@/components/ui/TagInput';
import { WatchStatusIcon } from '@/components/watchlist/WatchIcons';
import { searchTMDB, getTMDBDetails, getTMDBImageUrl, getTMDBBackdropUrl, TMDBResult, TMDBDetails } from '@/lib/tmdb';

export default function WatchlistAddPage() {
  const router = useRouter();
  const { addItem, customLists } = useWatchlist();

  // TMDB Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Selected TMDB Item State
  const [selectedTMDB, setSelectedTMDB] = useState<TMDBDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Form State
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<WatchItemType>('movie');
  const [status, setStatus] = useState<WatchStatus>('planned');
  const [genre, setGenre] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [listIds, setListIds] = useState<string[]>([]);
  
  // Overridable Details
  const [releaseYear, setReleaseYear] = useState<number | ''>('');
  const [duration, setDuration] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  
  // Series Specific
  const [currentSeason, setCurrentSeason] = useState<number | ''>('');
  const [currentEpisode, setCurrentEpisode] = useState<number | ''>('');
  const [totalSeasons, setTotalSeasons] = useState<number | ''>('');
  const [totalEpisodes, setTotalEpisodes] = useState<number | ''>('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch TMDB
  useEffect(() => {
    async function fetchResults() {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const results = await searchTMDB(debouncedQuery);
      setSearchResults(results);
      setIsSearching(false);
    }
    fetchResults();
  }, [debouncedQuery]);

  const handleSelectResult = async (result: TMDBResult) => {
    setIsLoadingDetails(true);
    const details = await getTMDBDetails(result.id, result.media_type);
    if (details) {
      setSelectedTMDB(details);
      setType(details.media_type === 'tv' ? 'series' : 'movie');
      
      if (details.genres && details.genres.length > 0) {
        const primaryGenre = details.genres[0].name;
        if (GENRE_OPTIONS.includes(primaryGenre as any)) {
          setGenre(primaryGenre);
        }
      }
      
      const dateStr = details.release_date || details.first_air_date;
      setReleaseYear(dateStr ? new Date(dateStr).getFullYear() : '');
      setDuration(details.runtime || details.episode_run_time?.[0] || '');
      setDescription(details.overview?.trim() || '');
      setTotalSeasons(details.number_of_seasons || '');
      setTotalEpisodes(details.number_of_episodes || '');
      
      // Reset statuses
      setCurrentSeason('');
      setCurrentEpisode('');
      setRating(details.vote_average ? Number(details.vote_average.toFixed(1)) : 0);
      setNote('');
      setTags([]);
      setListIds([]);
    }
    setIsLoadingDetails(false);
  };

  const getTrailerUrl = (details: TMDBDetails) => {
    if (!details.videos || !details.videos.results) return undefined;
    
    // Önce Türkçe fragmanları bulalım
    const trTrailers = details.videos.results.filter(v => v.site === 'YouTube' && v.type === 'Trailer' && v.iso_639_1 === 'tr');
    // Eğer Türkçe yoksa, İngilizce (veya ilk bulduğunu) fragmanları al
    const enTrailers = details.videos.results.filter(v => v.site === 'YouTube' && v.type === 'Trailer');
    // Eğer hiçbir 'Trailer' yoksa, herhangi bir YouTube videosunu al (Teaser vb.)
    const anyVideo = details.videos.results.filter(v => v.site === 'YouTube');

    const video = trTrailers[0] || enTrailers[0] || anyVideo[0];
    if (video) {
      return `https://www.youtube.com/watch?v=${video.key}`;
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTMDB) return;

    setSaving(true);
    try {
      await addItem({
        title: (selectedTMDB.title || selectedTMDB.name || 'İsimsiz').trim(),
        type,
        status,
        genre: genre || undefined,
        rating: rating > 0 ? rating : undefined,
        releaseYear: releaseYear !== '' ? Number(releaseYear) : undefined,
        duration: duration !== '' ? Number(duration) : undefined,
        description: description.trim() || undefined,
        note: note.trim() || undefined,
        tags,
        listIds,
        currentSeason: type === 'series' && currentSeason !== '' ? Number(currentSeason) : undefined,
        currentEpisode: type === 'series' && currentEpisode !== '' ? Number(currentEpisode) : undefined,
        totalSeasons: type === 'series' && totalSeasons !== '' ? Number(totalSeasons) : undefined,
        totalEpisodes: type === 'series' && totalEpisodes !== '' ? Number(totalEpisodes) : undefined,
        posterUrl: getTMDBImageUrl(selectedTMDB.poster_path) || undefined,
        backdropUrl: getTMDBBackdropUrl(selectedTMDB.backdrop_path) || undefined,
        tmdbId: selectedTMDB.id,
        trailerUrl: getTrailerUrl(selectedTMDB)
      });

      showToast(type === 'movie' ? 'Film eklendi!' : 'Dizi eklendi!');
      router.push('/watchlist');
    } catch (error) {
      console.error(error);
      showToast('Kaydedilirken bir hata oluştu', 'error');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen page-enter pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 themed-header shadow-sm">
        <div className="px-4 lg:px-6 py-6 mb-2 flex items-center gap-3">
          <button 
            onClick={() => selectedTMDB ? setSelectedTMDB(null) : router.push('/watchlist')} 
            className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors haptic-tap"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {selectedTMDB ? 'Kayıt Detayları' : 'Yeni Ekle'}
            </h1>
            <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {selectedTMDB ? 'İzleme durumunu ayarla' : 'TMDB veritabanında ara'}
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6 max-w-2xl mx-auto">
        
        <AnimatePresence mode="wait">
          {!selectedTMDB ? (
            <motion.div 
              key="search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Film veya Dizi adı yazın..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl font-medium shadow-sm transition-shadow focus:shadow-md outline-none"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                  autoFocus
                />
                {isSearching && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {searchResults.map((result, index) => (
                    <div 
                      key={`${result.media_type}-${result.id}-${index}`} 
                      onClick={() => handleSelectResult(result)}
                      className="group cursor-pointer rounded-2xl overflow-hidden relative aspect-[2/3] transition-transform hover:scale-105 haptic-tap shadow-sm"
                      style={{ background: 'var(--bg-secondary)' }}
                    >
                      {result.poster_path ? (
                        <img 
                          src={getTMDBImageUrl(result.poster_path) || ''} 
                          alt={result.title || result.name || ''} 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center opacity-40">
                          <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-xs font-bold uppercase">Afiş Yok</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-3 pt-12 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end">
                        <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">
                          {result.title || result.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-white/20 text-white/90">
                            {result.media_type === 'movie' ? 'FİLM' : 'DİZİ'}
                          </span>
                          <span className="text-xs font-medium text-white/70">
                            {(result.release_date || result.first_air_date)?.substring(0, 4) || 'Tarih Yok'}
                          </span>
                        </div>
                      </div>
                      
                      {isLoadingDetails && <div className="absolute inset-0 bg-black/50 z-20" />}
                    </div>
                  ))}
                </div>
              ) : debouncedQuery.length > 2 && !isSearching ? (
                <div className="text-center py-12 opacity-50">
                  Sonuç bulunamadı. Lütfen İngilizce veya orijinal adıyla aramayı deneyin.
                </div>
              ) : null}

              {/* TMDB Attribution Footer */}
              <div className="flex flex-col items-center justify-center pt-8 pb-4 opacity-50">
                <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium">Powered by</span>
                  <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" alt="TMDB Logo" className="h-3" />
                </a>
                <p className="text-[10px] text-center mt-2 max-w-xs">
                  This product uses the TMDB API but is not endorsed or certified by TMDB.
                </p>
              </div>

            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Selected Movie Header */}
              <div className="flex gap-4 p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                <div className="w-24 shrink-0 rounded-xl overflow-hidden aspect-[2/3] bg-black/10 relative">
                  {selectedTMDB.poster_path ? (
                    <img src={getTMDBImageUrl(selectedTMDB.poster_path) || ''} alt="Afiş" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex flex-col py-1">
                  <h2 className="text-xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {selectedTMDB.title || selectedTMDB.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      {type === 'movie' ? 'FİLM' : 'DİZİ'}
                    </span>
                    {releaseYear && (
                      <span className="text-xs font-medium opacity-70">
                        {releaseYear}
                      </span>
                    )}
                    {selectedTMDB.vote_average > 0 && (
                      <span className="text-xs font-medium flex items-center gap-1 text-[#f5c518]">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        {selectedTMDB.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-2 line-clamp-3 opacity-60" style={{ color: 'var(--text-primary)' }}>
                    {selectedTMDB.overview}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="themed-card p-5 space-y-6 rounded-2xl" style={{ background: 'var(--bg-card)' }}>
                  
                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Ne durumdasınız?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(WATCH_STATUS_INFO) as [WatchStatus, { label: string; icon: string; color: string }][]).map(([key, info]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setStatus(key)}
                          className="flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all haptic-tap"
                          style={{ 
                            borderColor: status === key ? info.color : 'transparent',
                            background: status === key ? `${info.color}15` : 'var(--bg-secondary)',
                            color: status === key ? info.color : 'var(--text-secondary)'
                          }}
                        >
                          <WatchStatusIcon icon={info.icon} className="w-5 h-5 mb-1.5" />
                          <span className="text-xs font-bold">{info.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Series Info Read-Only */}
                  {type === 'series' && (
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-xl" style={{ background: 'rgba(var(--accent-rgb), 0.05)', border: '1px dashed var(--accent)' }}>
                      <div>
                        <label className="block text-xs font-bold mb-1.5 opacity-70" style={{ color: 'var(--text-primary)' }}>Toplam Sezon</label>
                        <div className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{totalSeasons || '?'}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1.5 opacity-70" style={{ color: 'var(--text-primary)' }}>Toplam Bölüm</label>
                        <div className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{totalEpisodes || '?'}</div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Release Year */}
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Çıkış Yılı</label>
                      <input
                        type="number"
                        min="1900"
                        value={releaseYear}
                        onChange={e => setReleaseYear(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-lg text-sm themed-input"
                        placeholder="Örn: 2023"
                      />
                    </div>
                    {/* Duration */}
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Süre (Dk)</label>
                      <input
                        type="number"
                        min="1"
                        value={duration}
                        onChange={e => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-lg text-sm themed-input"
                        placeholder="Örn: 120"
                      />
                    </div>
                  </div>

                  {/* Personal Rating */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Kişisel Puanınız (İsteğe Bağlı)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-accent">★</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={rating || ''}
                        onChange={e => setRating(e.target.value === '' ? 0 : Number(e.target.value))}
                        className="w-full pl-12 pr-4 py-3 rounded-xl text-sm themed-input"
                        placeholder="10 üzerinden puanınız..."
                      />
                    </div>
                  </div>

                  {/* Custom Lists */}
                  {customLists && customLists.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Özel Listelere Ekle (İsteğe Bağlı)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {customLists.map(list => {
                          const isSelected = listIds.includes(list.id);
                          return (
                            <label 
                              key={list.id} 
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer haptic-tap`}
                              style={{
                                borderColor: isSelected ? 'var(--accent)' : 'transparent',
                                background: isSelected ? 'rgba(var(--accent-rgb), 0.1)' : 'var(--bg-secondary)',
                                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'
                              }}
                            >
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'bg-accent border-accent' : 'border-[var(--text-tertiary)]'}`}>
                                {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <span className="text-sm font-medium truncate">{list.name}</span>
                              <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setListIds(listIds.filter(id => id !== list.id));
                                  } else {
                                    setListIds([...listIds, list.id]);
                                  }
                                }}
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Etiketler</label>
                    <TagInput tags={tags} onChange={setTags} />
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Kişisel Notunuz</label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm themed-input min-h-[80px]"
                      placeholder="Düşünceleriniz..."
                    />
                  </div>
                  
                  {/* Edit Description (Collapsible) */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Konu (TMDB Özeti)</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-xs themed-input opacity-70 focus:opacity-100 min-h-[80px]"
                      placeholder="Konu özeti..."
                    />
                  </div>

                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 rounded-xl font-bold text-white btn-accent disabled:opacity-50 transition-opacity haptic-tap flex items-center justify-center gap-2"
                >
                  {saving ? 'Kaydediliyor...' : 'Listeme Ekle'}
                  {!saving && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
