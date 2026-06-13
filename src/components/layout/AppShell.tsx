'use client';

import { useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { ToastProvider } from '@/components/ui/Toast';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import PreferencesProvider, { usePreferences } from '@/components/providers/PreferencesProvider';
import { DialogProvider } from '@/components/providers/DialogProvider';
import PageTransition from '@/components/ui/PageTransition';
import InstallPrompt from '@/components/ui/InstallPrompt';

import WelcomeScreen from './WelcomeScreen';

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { prefs, loaded } = usePreferences();
  const sidebarWidth = prefs.sidebarCollapsed ? '64px' : '260px';

  useEffect(() => {
    const handleHaptic = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.haptic-tap')) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(15);
        }
      }
    };
    
    document.addEventListener('click', handleHaptic as any);
    document.addEventListener('touchstart', handleHaptic as any, { passive: true });
    
    return () => {
      document.removeEventListener('click', handleHaptic as any);
      document.removeEventListener('touchstart', handleHaptic as any);
    };
  }, []);

  // Wait for IndexedDB to load preferences to avoid hydration mismatch and wrong lock state
  if (!loaded) return null;

  // Show Welcome Screen if the app is explicitly locked, OR if no PIN is set yet (first launch or existing user without pin)
  if (prefs.isLocked || !prefs.pin) {
    return <WelcomeScreen />;
  }

  return (
    <>
      <TopBar />
      <Sidebar />
      <main 
        className="min-h-screen pt-16 lg:pt-0 pb-20 lg:pb-0 page-enter transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-width, 0px)' }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 1024px) {
            :root {
              --sidebar-width: ${sidebarWidth};
            }
          }
        `}} />
        {children}
      </main>
      <BottomNav />
      <InstallPrompt />
    </>
  );
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <PreferencesProvider>
      <DialogProvider>
        <ServiceWorkerRegistration />
        <AppShellInner>{children}</AppShellInner>
        <ToastProvider />
      </DialogProvider>
    </PreferencesProvider>
  );
}
