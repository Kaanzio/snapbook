'use client';

import { useEffect, useState } from 'react';
import { getAllWatchItems, getAllCustomLists } from '@/lib/indexeddb';

export default function BridgePage() {
  const [status, setStatus] = useState('Köprü hazır, dinleniyor...');

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      // Validate origin: accept local development hosts
      const isLocal = event.origin.includes('localhost') || event.origin.includes('127.0.0.1');
      if (!isLocal) return;

      if (event.data?.type === 'REQUEST_WATCHBOOK_DATA') {
        setStatus(`Veri isteği alındı (${event.origin}), hazırlanıyor...`);
        try {
          const items = await getAllWatchItems();
          const customLists = await getAllCustomLists();
          const tmdbKey = localStorage.getItem('snapbook_tmdb_api_key');
          const listOrder = localStorage.getItem('snapbook-list-order');

          (event.source as Window)?.postMessage(
            {
              type: 'WATCHBOOK_DATA_RESPONSE',
              payload: {
                items,
                customLists,
                tmdbKey,
                listOrder: listOrder ? JSON.parse(listOrder) : null,
              },
            },
            event.origin
          );
          setStatus(`Veriler (${items.length} içerik, ${customLists.length} liste) başarıyla gönderildi!`);
        } catch (err: any) {
          setStatus(`Hata oluştu: ${err?.message || 'Bilinmeyen hata'}`);
        }
      }
    };

    window.addEventListener('message', handler);
    // Tell parent we are ready if embedded
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'SNAPBOOK_BRIDGE_READY' }, '*');
    }

    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-md p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
        <h1 className="font-bold text-base mb-2">Snapbook ↔ WatchBook Veri Köprüsü</h1>
        <p className="text-xs text-neutral-400 font-mono mb-4">{status}</p>
        <p className="text-xs text-neutral-500">Bu sayfa iki uygulama arasındaki güvenli yerel veri transferini sağlar.</p>
      </div>
    </div>
  );
}
