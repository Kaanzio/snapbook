'use client';

import { useState, useEffect } from 'react';
import { usePreferences } from '@/components/providers/PreferencesProvider';
import { ACCENT_PRESETS } from '@/types';
import Logo from '@/components/ui/Logo';

// Keeping onboarding slides just in case they visit the welcome flow for the first time
const ONBOARDING_SLIDES = [
  {
    type: 'info',
    title: "Snapbook'a Hoş Geldiniz",
    subtitle: "Kişisel, güvenli ve tamamen size ait fotoğraf günlüğünüz.",
    icon: <Logo className="h-16 w-auto" />
  },
  {
    type: 'info',
    title: "%100 Gizlilik",
    subtitle: "Fotoğraflarınız cihazınızdan asla dışarı çıkmaz, buluta yüklenmez. İnternetsiz bile çalışır.",
    icon: <svg className="w-16 h-16 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
  },
  {
    type: 'info',
    title: "Sonsuz Tuval",
    subtitle: "Fotoğraflarınızı özgürce yerleştirin, moodboard'lar tasarlayın ve anılarınızı haritalayın.",
    icon: <svg className="w-16 h-16 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>
  },
  {
    type: 'info',
    title: "Kırmızı Perde",
    subtitle: "İzlediğiniz veya izlemek istediğiniz film ve dizileri kendi kişisel listenizde takip edin.",
    icon: <svg className="w-16 h-16 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" /></svg>
  },
  {
    type: 'appearance',
    title: "Görünümü Seç",
    subtitle: "Karanlık tarafa mı geçeceksin yoksa aydınlıkta mı kalacaksın? Göz zevkine en uygun temayı belirle.",
    icon: <svg className="w-16 h-16 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
  },
  {
    type: 'theme',
    title: "Kendi Rengini Seç",
    subtitle: "Snapbook'u sana en uygun vurgu rengiyle kişiselleştir. İstediğin zaman ayarlardan değiştirebilirsin.",
    icon: <svg className="w-16 h-16 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>
  }
];

const PIN_LENGTH = 6; // Changed from 4 to 6 based on design

export default function WelcomeScreen() {
  const { prefs, updatePrefs } = usePreferences();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'welcome' | 'create' | 'confirm' | 'enter'>(prefs.pin ? 'enter' : 'welcome');
  const [slideIndex, setSlideIndex] = useState(0);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  // Handle pin input
  const handleInput = (num: string) => {
    if (error) setError(false);
    if (step === 'welcome') return;
    
    if (step === 'create') {
      if (pin.length < PIN_LENGTH) setPin(p => p + num);
    } else if (step === 'confirm') {
      if (confirmPin.length < PIN_LENGTH) setConfirmPin(p => p + num);
    } else if (step === 'enter') {
      if (pin.length < PIN_LENGTH) setPin(p => p + num);
    }
  };

  const handleBackspace = () => {
    if (error) setError(false);
    if (step === 'create') setPin(p => p.slice(0, -1));
    else if (step === 'confirm') setConfirmPin(p => p.slice(0, -1));
    else if (step === 'enter') setPin(p => p.slice(0, -1));
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (/[0-9]/.test(e.key)) handleInput(e.key);
      else if (e.key === 'Backspace') handleBackspace();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [step, pin, confirmPin, error]);

  // Check pin logic
  useEffect(() => {
    if (step === 'create' && pin.length === PIN_LENGTH) {
      setTimeout(() => setStep('confirm'), 300);
    } else if (step === 'confirm' && confirmPin.length === PIN_LENGTH) {
      if (pin === confirmPin) {
        setSuccess(true);
        setTimeout(() => {
          updatePrefs({ pin, isLocked: false });
        }, 1000);
      } else {
        setError(true);
        setTimeout(() => {
          setConfirmPin('');
          setStep('create');
          setPin('');
          setError(false);
        }, 1000);
      }
    } else if (step === 'enter' && pin.length === (prefs.pin?.length || PIN_LENGTH)) { // Graceful degradation for old 4-digit PINs
      if (pin === prefs.pin) {
        setSuccess(true);
        setTimeout(() => {
          updatePrefs({ isLocked: false });
        }, 1000);
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 1000);
      }
    }
  }, [pin, confirmPin, step, prefs.pin, updatePrefs]);

  const displayPin = step === 'confirm' ? confirmPin : pin;
  const isWelcome = step === 'welcome';
  const slide = ONBOARDING_SLIDES[slideIndex];

  // Convert hex var(--accent) to rgba for the subtle inner glow effect on keypad buttons if needed
  // Alternatively we just use box-shadow with currentColor

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-1000 ${success ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
         style={{ backgroundColor: '#050505' }}> {/* Deep pitch black background */}
      
      {/* Background Ornaments (Elegant Glowing Arcs) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top-Left Arc */}
        <div 
          className="absolute rounded-full border-[1.5px] opacity-60"
          style={{ 
            top: '-60vw', left: '-50vw', width: '150vw', height: '150vw',
            borderColor: 'var(--accent)', 
            boxShadow: '0 0 80px 2px var(--accent), inset 0 0 60px 2px var(--accent)',
            filter: 'blur(1px)'
          }} 
        />
        {/* Bottom-Right Arc */}
        <div 
          className="absolute rounded-full border-[1px] opacity-40"
          style={{ 
            bottom: '-50vw', right: '-40vw', width: '120vw', height: '120vw',
            borderColor: 'var(--accent)', 
            boxShadow: '0 0 100px 5px var(--accent), inset 0 0 50px 2px var(--accent)',
            filter: 'blur(2px)'
          }} 
        />
        {/* Ambient Corner Glows */}
        <div className="absolute top-0 left-0 w-[50vw] h-[50vw] opacity-10 mix-blend-screen rounded-full filter blur-[100px]"
             style={{ backgroundColor: 'var(--accent)' }} />
        <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] opacity-[0.15] mix-blend-screen rounded-full filter blur-[100px]"
             style={{ backgroundColor: 'var(--accent)' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-4">
        
        {isWelcome ? (
          <div className="flex flex-col items-center justify-center w-full min-h-[420px] animate-[fadeIn_0.5s_ease-out]">
            {slide.type === 'appearance' ? (
              // THEME MODE SELECTION SLIDE
              <>
                <div className="text-center mb-10 mt-4">
                  <h1 className="text-2xl font-bold mb-3 text-white">{slide.title}</h1>
                  <p className="text-sm font-medium leading-relaxed text-gray-400">{slide.subtitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10 w-full max-w-[280px]">
                  {[
                    { id: 'light', label: 'Aydınlık', bg: 'bg-[#F9FAFB]', text: 'text-gray-900', border: 'border-gray-200' },
                    { id: 'dark', label: 'Karanlık', bg: 'bg-[#1F2937]', text: 'text-white', border: 'border-gray-700' },
                    { id: 'oled', label: 'Zifiri', bg: 'bg-black', text: 'text-white', border: 'border-white/10' },
                    { id: 'system', label: 'Sistem', bg: 'bg-gradient-to-br from-gray-200 to-gray-800', text: 'text-white', border: 'border-gray-500' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updatePrefs({ theme: t.id as any })}
                      className={`relative flex flex-col items-center justify-center py-5 rounded-2xl border transition-all haptic-tap overflow-hidden ${t.bg} ${t.border} ${prefs.theme === t.id ? 'ring-2 ring-offset-2 ring-offset-[#050505] ring-[var(--accent)] scale-105 opacity-100 z-10' : 'hover:scale-105 opacity-60 hover:opacity-100'}`}
                    >
                      <span className={`font-semibold text-sm ${t.id === 'system' ? 'text-white drop-shadow-md' : t.text}`}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : slide.type === 'theme' ? (
              // THEME SELECTION SLIDE
              <>
                <div className="text-center mb-10 mt-4">
                  <h1 className="text-2xl font-bold mb-3 text-white">{slide.title}</h1>
                  <p className="text-sm font-medium leading-relaxed text-gray-400">{slide.subtitle}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-10 w-full max-w-[240px]">
                  {ACCENT_PRESETS.map((colorOption) => (
                    <button
                      key={colorOption.name}
                      onClick={() => updatePrefs({ accentColor: colorOption.value })}
                      className="group relative flex flex-col items-center justify-center gap-2 outline-none haptic-tap"
                      title={colorOption.name}
                    >
                      <div 
                        className={`w-12 h-12 rounded-full transition-all duration-300 shadow-sm
                          ${prefs.accentColor === colorOption.value ? 'scale-110 ring-4 ring-offset-2 ring-offset-[#050505]' : 'hover:scale-110'}
                        `}
                        style={{ 
                          backgroundColor: colorOption.value,
                          borderColor: 'var(--border-primary)',
                          borderWidth: colorOption.value.toUpperCase() === '#FFFFFF' || colorOption.value.toUpperCase() === '#E0E0E0' ? '1px' : '0',
                          '--tw-ring-color': colorOption.value
                        } as React.CSSProperties}
                      />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              // INFO SLIDES
              <>
                <div className="mb-8 transform transition-transform duration-700 hover:scale-105 flex items-center justify-center h-24">
                  {slide.icon}
                </div>

                <div className="text-center mb-8 h-24">
                  <h1 className="text-2xl font-bold mb-3 text-white">{slide.title}</h1>
                  <p className="text-sm font-medium leading-relaxed text-gray-400">{slide.subtitle}</p>
                </div>
              </>
            )}

            {/* Pagination & Next Button */}
            <div className="flex flex-col w-full items-center mt-auto">
              <div className="flex gap-2 mb-10">
                {ONBOARDING_SLIDES.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === slideIndex ? 'w-6' : 'w-2 opacity-30'}`}
                       style={{ background: 'var(--accent)' }} />
                ))}
              </div>

              <button 
                onClick={() => {
                  if (slideIndex < ONBOARDING_SLIDES.length - 1) {
                    setSlideIndex(s => s + 1);
                  } else {
                    setStep('create');
                  }
                }}
                className="w-full max-w-[240px] py-3.5 rounded-2xl font-bold text-sm text-white shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] transition-transform hover:scale-105 active:scale-95 haptic-tap"
                style={{ background: 'var(--accent)' }}
              >
                {slideIndex < ONBOARDING_SLIDES.length - 1 ? 'İleri' : 'Başla'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full animate-[fadeIn_0.5s_ease-out]">
            {/* Logo */}
            <div className="mb-10">
              <Logo className="h-10 w-auto" />
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-10">
              <h1 className="text-xl font-bold mb-2 text-white">
                {step === 'create' ? 'Yeni PIN Oluştur' : step === 'confirm' ? 'PIN\'i Tekrar Girin' : 'Hoş Geldiniz'}
              </h1>
              <p className="text-sm font-medium text-gray-400">
                {step === 'create' ? 'Snapbook\'u kilitlemek için 6 haneli şifre belirleyin' : step === 'confirm' ? 'Lütfen oluşturduğunuz şifreyi doğrulayın' : 'Devam etmek için şifrenizi girin'}
              </p>
            </div>

            {/* 6 PIN Dots */}
            <div className={`flex gap-3 mb-10 ${error ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${displayPin.length > i ? 'scale-110 border-transparent shadow-[0_0_10px_var(--accent)]' : 'scale-100'}`}
                     style={{ 
                       borderColor: displayPin.length > i ? 'transparent' : 'var(--accent)',
                       background: displayPin.length > i ? 'var(--accent)' : 'transparent',
                     }} 
                />
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-4 w-full max-w-[300px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button key={num} onClick={() => handleInput(num.toString())}
                  className="group relative aspect-square rounded-full flex items-center justify-center transition-transform active:scale-95 haptic-tap">
                  {/* Glowing Halo */}
                  <div className="absolute inset-0 rounded-full border-[1.5px] border-[var(--accent)] opacity-30 shadow-[0_0_15px_var(--accent),_inset_0_0_15px_var(--accent)] transition-opacity group-active:opacity-60 pointer-events-none" />
                  <span className="relative z-10 text-white text-[28px] font-bold">{num}</span>
                </button>
              ))}
              <div /> {/* Empty space for alignment */}
              <button onClick={() => handleInput('0')}
                className="group relative aspect-square rounded-full flex items-center justify-center transition-transform active:scale-95 haptic-tap">
                {/* Glowing Halo */}
                <div className="absolute inset-0 rounded-full border-[1.5px] border-[var(--accent)] opacity-30 shadow-[0_0_15px_var(--accent),_inset_0_0_15px_var(--accent)] transition-opacity group-active:opacity-60 pointer-events-none" />
                <span className="relative z-10 text-white text-[28px] font-bold">0</span>
              </button>
              
              {/* Backspace Button - Darker, crisp border, no colored glow to match design */}
              <button onClick={handleBackspace}
                className="relative aspect-square rounded-full flex items-center justify-center transition-transform active:scale-95 haptic-tap">
                <div className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.02] pointer-events-none" />
                <svg className="relative z-10 w-5 h-5 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
                </svg>
              </button>
            </div>

            {error && (
              <p className="absolute bottom-8 text-sm font-semibold text-red-500 animate-[fadeIn_0.2s_ease-out]">Hatalı şifre, tekrar deneyin.</p>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
      `}} />
    </div>
  );
}
