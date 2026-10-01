'use client';

import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { ToastProvider } from '@/components/ui/Toast';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import PreferencesProvider, { usePreferences } from '@/components/providers/PreferencesProvider';
import { DialogProvider } from '@/components/providers/DialogProvider';
import PageTransition from '@/components/ui/PageTransition';
import InstallPrompt from '@/components/ui/InstallPrompt';

import { usePathname } from 'next/navigation';
import WelcomeScreen from './WelcomeScreen';

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { prefs, loaded } = usePreferences();
  const pathname = usePathname();
  const isCanvasView = pathname.startsWith('/canvas/view');
  const sidebarWidth = isCanvasView ? '0px' : (prefs.sidebarCollapsed ? '64px' : '260px');

  // Wait for IndexedDB to load preferences to avoid hydration mismatch and wrong lock state
  if (!loaded) return null;

  // Show Welcome Screen if the app is explicitly locked, OR if no PIN is set yet (first launch or existing user without pin)
  if (prefs.isLocked || !prefs.pin) {
    return <WelcomeScreen />;
  }

  if (isCanvasView) {
    return (
      <main className="w-full h-full min-h-screen">
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --sidebar-width: 0px;
          }
        `}} />
        {children}
      </main>
    );
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
