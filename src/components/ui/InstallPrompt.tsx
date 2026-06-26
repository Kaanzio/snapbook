'use client';

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // Default true to prevent flash
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if the app is already installed/running in standalone mode
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone);
    setIsStandalone(!!isAppStandalone);

    if (isAppStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event (Android/Chrome/Edge)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Wait a bit before showing the prompt so it's not too aggressive
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS, maybe show prompt after a delay since iOS doesn't fire beforeinstallprompt
    if (isIOSDevice && !isAppStandalone) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If no prompt available but user clicked (maybe iOS)
      setShowPrompt(false);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 lg:bottom-6 lg:right-6 lg:left-auto lg:w-96 z-[60] animate-[slideUp_0.4s_ease-out]">
      <div 
        className="p-4 rounded-2xl shadow-xl flex items-start gap-4 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
      >
        <div className="w-12 h-12 shrink-0 rounded-xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
            Uygulamayı Yükle
          </h3>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {isIOS 
              ? "Snapbook'u iPhone'una kurmak için 'Paylaş' ikonuna tıkla ve 'Ana Ekrana Ekle'yi seç."
              : "Daha hızlı ve tam ekran deneyim için Snapbook'u cihazına yükle."}
          </p>
          
          <div className="flex items-center gap-2">
            {!isIOS && (
              <button 
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-bold haptic-tap cursor-pointer transition-transform active:scale-95"
              >
                Yükle
              </button>
            )}
            <button 
              onClick={dismissPrompt}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold haptic-tap cursor-pointer transition-colors"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              Şimdilik Geç
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
