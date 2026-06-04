'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWatchlist } from '@/hooks/useWatchlist';
import { WatchItemType, WatchStatus, WATCH_STATUS_INFO, WATCH_TYPE_INFO, GENRE_OPTIONS } from '@/types';
import { showToast } from '@/components/ui/Toast';
import TagInput from '@/components/ui/TagInput';

export default function WatchlistAddPage() {
  const router = useRouter();
  const { addItem, customLists } = useWatchlist();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<WatchItemType>('movie');
  const [status, setStatus] = useState<WatchStatus>('planned');
  const [genre, setGenre] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [listIds, setListIds] = useState<string[]>([]);

  // Series only
  const [currentSeason, setCurrentSeason] = useState<number | ''>('');
  const [currentEpisode, setCurrentEpisode] = useState<number | ''>('');
  const [totalSeasons, setTotalSeasons] = useState<number | ''>('');
  const [totalEpisodes, setTotalEpisodes] = useState<number | ''>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      const url = URL.createObjectURL(file);
      if (posterPreview) URL.revokeObjectURL(posterPreview);
      setPosterPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Lütfen bir başlık girin', 'error');
      return;
    }

    setSaving(true);
    try {
      await addItem({
        title: title.trim(),
        type,
        status,
        genre: genre || undefined,
        rating: rating > 0 ? rating : undefined,
        description: description.trim() || undefined,
        note: note.trim() || undefined,
        tags,
        listIds,
        currentSeason: type === 'series' && currentSeason !== '' ? Number(currentSeason) : undefined,
        currentEpisode: type === 'series' && currentEpisode !== '' ? Number(currentEpisode) : undefined,
        totalSeasons: type === 'series' && totalSeasons !== '' ? Number(totalSeasons) : undefined,
        totalEpisodes: type === 'series' && totalEpisodes !== '' ? Number(totalEpisodes) : undefined,
      }, posterFile || undefined);

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
        <div className="px-4 lg:px-6 py-4 flex items-center gap-3">
          <Link href="/watchlist" className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors haptic-tap">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Yeni Ekle</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>İzleme listesine film veya dizi ekle</p>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Poster Upload Area */}
          <div className="flex flex-col items-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-40 h-60 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-[1.02] haptic-tap overflow-hidden relative group"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}
            >
              {posterPreview ? (
                <>
                  <img src={posterPreview} alt="Afiş" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Değiştir</span>
                  </div>
                </>
              ) : (
                <>
                  <svg className="w-10 h-10 mb-2 opacity-50" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v12a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Afiş Ekle</span>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <div className="mt-4">
              <a 
                href="https://www.themoviedb.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline transition-all hover:scale-105 haptic-tap"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Afiş bulmak için TMDB'de ara
              </a>
            </div>
          </div>

          <div className="themed-card p-5 space-y-5 rounded-2xl" style={{ background: 'var(--bg-card)' }}>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Başlık *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm themed-input"
                placeholder="Film veya dizi adı"
              />
            </div>

            {/* Type Toggle */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tür</label>
              <div className="flex p-1 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                {(Object.entries(WATCH_TYPE_INFO) as [WatchItemType, { label: string; icon: string }][]).map(([key, info]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all haptic-tap
                      ${type === key ? 'bg-white dark:bg-black shadow-sm' : 'opacity-70'}`}
                    style={{ color: type === key ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    <span>{info.icon}</span>
                    {info.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Durum</label>
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
                    <span className="text-xl mb-1">{info.icon}</span>
                    <span className="text-xs font-medium">{info.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Series Fields */}
            {type === 'series' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Mevcut Sezon</label>
                  <input
                    type="number"
                    min="1"
                    value={currentSeason}
                    onChange={e => setCurrentSeason(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm themed-input"
                    placeholder="Örn: 2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Mevcut Bölüm</label>
                  <input
                    type="number"
                    min="1"
                    value={currentEpisode}
                    onChange={e => setCurrentEpisode(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm themed-input"
                    placeholder="Örn: 5"
                  />
                </div>
              </div>
            )}

            {/* Genre */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Kategori</label>
              <select
                value={genre}
                onChange={e => setGenre(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm themed-input appearance-none bg-no-repeat"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1em'
                }}
              >
                <option value="">Seçiniz...</option>
                {GENRE_OPTIONS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Puan</label>
              <div className="flex gap-1 justify-between">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(rating === star ? 0 : star)}
                    className="flex-1 aspect-square rounded-lg flex items-center justify-center transition-all haptic-tap text-sm"
                    style={{
                      background: rating >= star ? '#facc15' : 'var(--bg-secondary)',
                      color: rating >= star ? '#000' : 'var(--text-tertiary)'
                    }}
                  >
                    {star}
                  </button>
                ))}
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Açıklama (Konu)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm themed-input min-h-[80px]"
                placeholder="Film/Dizi hakkında..."
              />
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

          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-xl font-bold text-white btn-accent disabled:opacity-50 transition-opacity haptic-tap"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      </main>
    </div>
  );
}
