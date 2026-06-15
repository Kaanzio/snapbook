'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import dynamic from 'next/dynamic';

const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner), { 
  ssr: false,
  loading: () => <div className="p-8 text-center text-tertiary">Kamera başlatılıyor...</div>
});
import { SyncManager, SyncProgress } from '@/lib/sync';
import { showToast } from '@/components/ui/Toast';

export default function SyncPage() {
  const [peerId, setPeerId] = useState<string>('');
  const [mode, setMode] = useState<'idle' | 'host' | 'scan'>('idle');
  const [progress, setProgress] = useState<SyncProgress>({ status: 'disconnected', message: '', progress: 0 });
  const [incomingRequest, setIncomingRequest] = useState<{peerId: string, accept: () => void, reject: () => void} | null>(null);
  const [manualPeerId, setManualPeerId] = useState('');
  const syncManager = useRef<SyncManager | null>(null);

  useEffect(() => {
    const manager = new SyncManager(
      (prog) => setProgress(prog),
      (reqPeerId, accept, reject) => {
        setIncomingRequest({ peerId: reqPeerId, accept, reject });
      }
    );
    
    syncManager.current = manager;

    // We don't auto-initialize until user clicks "Host" or "Scan" 
    // to avoid unnecessary connections.

    return () => {
      manager.disconnect();
    };
  }, []);

  const startHosting = async () => {
    if (!syncManager.current) return;
    setMode('host');
    try {
      const id = await syncManager.current.initialize();
      setPeerId(id);
    } catch (error) {
      showToast('Bağlantı oluşturulamadı. Lütfen internet bağlantınızı kontrol edin.', 'error');
      setMode('idle');
    }
  };

  const startScanning = async () => {
    if (!syncManager.current) return;
    setMode('scan');
    try {
      await syncManager.current.initialize();
    } catch (error) {
      showToast('Tarayıcı başlatılamadı.', 'error');
      setMode('idle');
    }
  };

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes.length > 0) {
      const targetPeerId = detectedCodes[0].rawValue;
      if (targetPeerId && syncManager.current) {
        setMode('idle');
        syncManager.current.connectToPeer(targetPeerId);
      }
    }
  };

  const handleScanError = (err: unknown) => {
    console.error('Kamera hatası:', err);
    showToast('Kamera açılamadı. Lütfen kamera izinlerini verdiğinizden ve uygulamanın güvenli bağlantı (HTTPS) veya localhost üzerinde çalıştığından emin olun.', 'error');
  };

  const handleManualConnect = () => {
    if (manualPeerId.trim() && syncManager.current) {
      setMode('idle');
      syncManager.current.connectToPeer(manualPeerId.trim());
    }
  };

  const handleAccept = () => {
    if (incomingRequest) {
      incomingRequest.accept();
      setIncomingRequest(null);
    }
  };

  const handleReject = () => {
    if (incomingRequest) {
      incomingRequest.reject();
      setIncomingRequest(null);
    }
  };

  return (
    <div className="min-h-screen pb-20 pt-4 px-4 bg-primary text-primary">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/settings" className="w-10 h-10 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center haptic-tap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </Link>
          <h1 className="text-2xl font-black tracking-tight">Cihaz Senkronizasyonu</h1>
        </div>

        <div className="themed-card p-6">
          <p className="text-tertiary mb-6">
            Hiçbir bulut sunucuya ihtiyaç duymadan cihazlarınız arasında güvenli ve tamamen ücretsiz veri eşitlemesi yapın. (Not: İki cihazın da internete bağlı olması gerekir)
          </p>

          {/* Controls */}
          {progress.status === 'disconnected' && mode === 'idle' && !incomingRequest && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={startHosting} className="btn-accent py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 haptic-tap">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 9h6v6H9z"/></svg>
                <span>QR Kod Oluştur</span>
                <span className="text-xs font-normal opacity-80">Bu cihazdan paylaş</span>
              </button>
              
              <button onClick={startScanning} className="bg-secondary border border-primary py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 haptic-tap hover:bg-black/5 dark:hover:bg-white/5">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
                <span>QR Kod Tara</span>
                <span className="text-xs font-normal opacity-80">Diğer cihaza bağlan</span>
              </button>
            </div>
          )}

          {/* Hosting Mode (QR Code) */}
          {mode === 'host' && progress.status === 'disconnected' && !incomingRequest && (
            <div className="flex flex-col items-center justify-center p-6 space-y-6">
              <h3 className="font-bold text-lg">Bu cihazı tarayın</h3>
              {peerId ? (
                <div className="p-4 bg-white rounded-2xl shadow-lg">
                  <QRCodeSVG value={peerId} size={250} />
                </div>
              ) : (
                <div className="animate-pulse w-[250px] h-[250px] bg-black/10 dark:bg-white/10 rounded-2xl"></div>
              )}
              
              {peerId && (
                <div className="flex flex-col items-center gap-2 mt-4">
                  <p className="text-xs text-tertiary">Veya manuel bağlantı kodunu kopyalayın:</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(peerId);
                      showToast('Kod kopyalandı!');
                    }}
                    className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded-full text-xs font-mono select-all haptic-tap"
                  >
                    {peerId}
                  </button>
                </div>
              )}

              <p className="text-sm text-tertiary text-center max-w-xs mt-4">Diğer cihazınızda Snapbook'u açın ve "QR Kod Tara" seçeneğini kullanarak bu kodu okutun.</p>
              <button onClick={() => setMode('idle')} className="text-sm text-red-500 font-bold haptic-tap">İptal Et</button>
            </div>
          )}

          {/* Scanning Mode */}
          {mode === 'scan' && progress.status === 'disconnected' && (
            <div className="flex flex-col items-center justify-center space-y-6">
              <h3 className="font-bold text-lg">QR Kodu Tarayın</h3>
              
              <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg border-2 border-accent bg-black">
                <Scanner onScan={handleScan} onError={handleScanError} />
              </div>
              
              <div className="w-full max-w-sm pt-4 border-t border-black/10 dark:border-white/10 flex flex-col gap-3">
                <p className="text-xs text-center text-tertiary">Kamera açılmıyorsa kodu manuel girebilirsiniz:</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Diğer cihazın kodunu yapıştırın..." 
                    value={manualPeerId}
                    onChange={(e) => setManualPeerId(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl text-sm themed-input"
                  />
                  <button onClick={handleManualConnect} className="btn-accent px-4 py-2 rounded-xl text-sm font-bold haptic-tap whitespace-nowrap">Bağlan</button>
                </div>
              </div>

              <button onClick={() => setMode('idle')} className="text-sm text-red-500 font-bold haptic-tap mt-4">İptal Et</button>
            </div>
          )}

          {/* Sync Progress */}
          {progress.status !== 'disconnected' && !incomingRequest && (
            <div className="flex flex-col items-center justify-center p-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                {progress.status === 'completed' ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : progress.status === 'error' ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                ) : (
                  <svg className="animate-spin text-accent" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                )}
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="font-bold text-xl">
                  {progress.status === 'completed' ? 'Başarılı!' : 
                   progress.status === 'error' ? 'Hata!' : 'Senkronize Ediliyor...'}
                </h3>
                <p className="text-sm text-tertiary">{progress.message}</p>
              </div>

              {(progress.status === 'syncing' || progress.status === 'connecting' || progress.status === 'connected') && (
                <div className="w-full max-w-xs h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress.progress}%` }}></div>
                </div>
              )}

              {progress.status === 'completed' && (
                <button onClick={() => { setProgress({status: 'disconnected', message: '', progress: 0}); setMode('idle'); }} className="btn-accent px-6 py-2 rounded-xl font-bold haptic-tap">
                  Tamamla
                </button>
              )}
            </div>
          )}

          {/* Incoming Request Modal */}
          {incomingRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="themed-card p-6 max-w-sm w-full space-y-6">
                <div className="w-16 h-16 rounded-full bg-accent-soft text-accent flex items-center justify-center mx-auto">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Bağlantı İsteği</h3>
                  <p className="text-sm text-tertiary">Bir cihaz sizinle senkronize olmak istiyor. Onaylıyor musunuz?</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleReject} className="py-3 rounded-xl border border-red-500 text-red-500 font-bold haptic-tap">Reddet</button>
                  <button onClick={handleAccept} className="btn-accent py-3 rounded-xl font-bold haptic-tap">Kabul Et</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
