'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/chat');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
