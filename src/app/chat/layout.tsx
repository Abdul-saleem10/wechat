'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { AppProvider } from '@/providers/app.provider';
import { NotificationProvider } from '@/providers/notification.provider';
import { Sidebar } from '@/components/sidebar/Sidebar';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  return (
    <AppProvider>
      <NotificationProvider>
        <div className="flex h-screen bg-background overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            {children}
          </main>
        </div>
      </NotificationProvider>
    </AppProvider>
  );
}
