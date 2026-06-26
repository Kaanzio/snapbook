'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SyncManager, SyncProgress } from '@/lib/sync';
import { showToast } from '@/components/ui/Toast';

export default function SyncPage() {
  const [peerId, setPeerId] = useState<string>('');
  const [mode, setMode] = useState<'idle' | 'host' | 'connect'>('idle');
  const [progress, setProgress] = useState<SyncProgress>({ status: 'disconnected', message: '', progress: 0 });
  const [incomingRequest, setIncomingRequest] = useState<{ peerId: string; accept: () => void; reject: () => void } | null>(null);
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const syncManager = useRef<SyncManager | null>(null);

  useEffect(() => {
    const manager = new SyncManager(
      (prog) => setProgress(prog),
      (reqPeerId, accept, reject) => {
        setIncomingRequest({ peerId: reqPeerId, accept, reject });
      }
    );
    syncManager.current = manager;
    return () => { manager.disconnect(); };
  }, []);

  const startHosting = async () => {
    if (!syncManager.current) return;
    setMode('host');
    try {
      // Generate a 6-digit PIN and register it as the PeerJS ID
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const id = await syncManager.current.initialize(pin);
      setPeerId(id); // id === pin
    } catch {
      showToast('Bağlantı oluşturulamadı.', 'error');
      setMode('idle');
    }
  };

  const startConnect = async () => {
    if (!syncManager.current) return;
    setMode('connect');
    setPinDigits(['', '', '', '', '', '']);
    try {
      await syncManager.current.initialize();
    } catch {
      showToast('Başlatılamadı.', 'error');
      setMode('idle');
    }
    // Focus first input
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const handlePinInput = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...pinDigits];
    next[index] = digit;
    setPinDigits(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-connect when all 6 digits are filled
    if (index === 5 && digit) {
      const pin = [...next.slice(0, 5), digit].join('');
      if (pin.length === 6 && syncManager.current) {
        syncManager.current.connectToPeer(pin);
        setMode('idle');
      }
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setPinDigits(pasted.split(''));
      if (syncManager.current) {
        syncManager.current.connectToPeer(pasted);
        setMode('idle');
      }
    }
  };

  const handleManualConnect = () => {
    const pin = pinDigits.join('');
    if (pin.length === 6 && syncManager.current) {
      syncManager.current.connectToPeer(pin);
      setMode('idle');
    } else {
      showToast('Lütfen 6 haneli kodu eksiksiz girin.', 'error');
    }
  };

  const displayPin = peerId; // peerId is the 6-digit PIN itself

  const handleAccept = () => { incomingRequest?.accept(); setIncomingRequest(null); };
  const handleReject = () => { incomingRequest?.reject(); setIncomingRequest(null); };

  return (
    <div className="min-h-screen pb-20 pt-4 px-4 bg-primary text-primary">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/settings" className="w-10 h-10 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center haptic-tap cursor-pointer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Cihaz Eşitleme</h1>
            <p className="text-xs text-tertiary">Ücretsiz · Sunucusuz · P2P</p>
          </div>
        </div>

        {/* Idle: Choose mode */}
        {progress.status === 'disconnected' && mode === 'idle' && !incomingRequest && (
          <div className="space-y-4">
            <div className="themed-card p-5">
              <p className="text-sm text-tertiary text-center mb-6">
                Veri paylaşmak istediğiniz cihazı seçin
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={startHosting} className="btn-accent py-5 rounded-2xl font-bold flex flex-col items-center justify-center gap-3 haptic-tap cursor-pointer">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v1m0 16v1M4.22 4.22l.7.7m12.16 12.16.7.7M3 12h1m16 0h1M4.92 19.07l.7-.7M18.36 5.64l.7-.7" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  <div className="text-center">
                    <div className="text-sm font-bold">Kod Üret</div>
                    <div className="text-xs font-normal opacity-75 mt-0.5">Bu cihazdan paylaş</div>
                  </div>
                </button>

                <button onClick={startConnect} className="bg-secondary border border-primary py-5 rounded-2xl font-bold flex flex-col items-center justify-center gap-3 haptic-tap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <div className="text-center">
                    <div className="text-sm font-bold">Kodu Gir</div>
                    <div className="text-xs font-normal opacity-75 mt-0.5">Diğer cihaza bağlan</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5">
              <div className="flex gap-3 items-start">
                <svg className="w-4 h-4 text-tertiary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                </svg>
                <p className="text-xs text-tertiary">
                  <strong className="text-secondary">Nasıl çalışır?</strong> Veri paylaşacak cihazda "Kod Üret"e basın, çıkan 6 haneli kodu diğer cihaza girin. İki cihazın da internete bağlı olması gerekir.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Host: Show PIN */}
        {mode === 'host' && progress.status === 'disconnected' && !incomingRequest && (
          <div className="themed-card p-6 flex flex-col items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v1m0 16v1M4.22 4.22l.7.7m12.16 12.16.7.7M3 12h1m16 0h1M4.92 19.07l.7-.7M18.36 5.64l.7-.7" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </div>

            <div className="text-center">
              <h2 className="font-black text-xl mb-1">Bağlantı Kodu</h2>
              <p className="text-sm text-tertiary">Diğer cihazda bu kodu girin</p>
            </div>

            {displayPin ? (
              <>
                {/* Big PIN display */}
                <div className="flex gap-2">
                  {displayPin.split('').map((ch, i) => (
                    <div
                      key={i}
                      className="w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-black font-mono border-2"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                    >
                      {ch}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(displayPin);
                    showToast('Kod kopyalandı!');
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold haptic-tap cursor-pointer"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  Kopyala
                </button>

                <div className="flex items-center gap-2 text-xs text-tertiary">
                  <svg className="animate-pulse w-3 h-3 text-green-500" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="currentColor"/></svg>
                  Diğer cihazın bağlanması bekleniyor...
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-12 h-14 rounded-xl animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
                ))}
              </div>
            )}

            <button onClick={() => { setPeerId(''); setMode('idle'); }} className="text-sm text-red-500 font-bold haptic-tap cursor-pointer">
              İptal Et
            </button>
          </div>
        )}

        {/* Connect: Enter PIN */}
        {mode === 'connect' && progress.status === 'disconnected' && (
          <div className="themed-card p-6 flex flex-col items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>

            <div className="text-center">
              <h2 className="font-black text-xl mb-1">Kodu Girin</h2>
              <p className="text-sm text-tertiary">Diğer cihazdaki 6 haneli kodu girin</p>
            </div>

            {/* PIN inputs */}
            <div className="flex gap-2" onPaste={handlePinPaste}>
              {pinDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinInput(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  className="w-12 h-14 rounded-xl text-center text-2xl font-black font-mono border-2 outline-none transition-all"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: digit ? 'var(--accent)' : 'var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleManualConnect}
              className="btn-accent w-full py-3 rounded-xl font-bold haptic-tap cursor-pointer"
            >
              Bağlan
            </button>

            <button onClick={() => { setPinDigits(['', '', '', '', '', '']); setMode('idle'); }} className="text-sm text-red-500 font-bold haptic-tap cursor-pointer">
              İptal Et
            </button>
          </div>
        )}

        {/* Sync Progress */}
        {progress.status !== 'disconnected' && !incomingRequest && (
          <div className="themed-card p-8 flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: progress.status === 'completed' ? 'var(--accent)' : progress.status === 'error' ? '#ef4444' : 'var(--bg-secondary)' }}>
              {progress.status === 'completed' ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : progress.status === 'error' ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              ) : (
                <svg className="animate-spin" style={{ color: 'var(--accent)' }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              )}
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-xl">
                {progress.status === 'completed' ? '🎉 Eşitleme Tamamlandı!' : progress.status === 'error' ? 'Bir Hata Oluştu' : 'Eşitleniyor...'}
              </h3>
              <p className="text-sm text-tertiary">{progress.message}</p>
            </div>

            {(progress.status === 'syncing' || progress.status === 'connecting' || progress.status === 'connected') && (
              <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress.progress}%` }} />
              </div>
            )}

            {progress.status === 'completed' && (
              <button
                onClick={() => { setProgress({ status: 'disconnected', message: '', progress: 0 }); setMode('idle'); }}
                className="btn-accent px-8 py-3 rounded-xl font-bold haptic-tap cursor-pointer"
              >
                Tamam
              </button>
            )}
          </div>
        )}

        {/* Incoming Request Modal */}
        {incomingRequest && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="themed-card p-6 w-full max-w-sm space-y-5 rounded-3xl">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black mb-1">Bağlantı İsteği</h3>
                <p className="text-sm text-tertiary">Bir cihaz verileri eşitlemek istiyor. Onaylıyor musunuz?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleReject} className="py-3 rounded-xl border font-bold haptic-tap cursor-pointer text-red-500" style={{ borderColor: '#ef4444' }}>Reddet</button>
                <button onClick={handleAccept} className="btn-accent py-3 rounded-xl font-bold haptic-tap cursor-pointer">Kabul Et</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
