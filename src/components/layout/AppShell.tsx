'use client';

import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { ToastProvider } from '@/components/ui/Toast';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import PreferencesProvider, { usePreferences } from '@/components/providers/PreferencesProvider';
import { DialogProvider } from '@/components/providers/DialogProvider';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import PageTransition from '@/components/ui/PageTransition';

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { prefs } = usePreferences();
  const sidebarWidth = prefs.sidebarCollapsed ? '64px' : '260px';

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
      <FloatingActionButton />
      <BottomNav />
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
