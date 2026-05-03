'use client';

import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { ToastProvider } from '@/components/ui/Toast';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import PreferencesProvider from '@/components/providers/PreferencesProvider';
import FloatingActionButton from '@/components/ui/FloatingActionButton';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <PreferencesProvider>
      <ServiceWorkerRegistration />
      <TopBar />
      <Sidebar />
      <main className="lg:ml-[260px] min-h-screen pt-16 lg:pt-0 pb-20 lg:pb-0 page-enter">
        {children}
      </main>
      <FloatingActionButton />
      <BottomNav />
      <ToastProvider />
    </PreferencesProvider>
  );
}
