'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, hasConfig } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, clearUser } = useAuthStore();

  useEffect(() => {
    if (!hasConfig || !auth) {
      setLoading(false);
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await authService.getUserData(firebaseUser.uid);
          if (userData) {
            setUser({ ...userData, online: true });
          } else {
            setUser({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              avatar: firebaseUser.photoURL || '',
              bio: '',
              lastSeen: new Date(),
              online: true,
              createdAt: new Date(),
            });
          }
        } catch {
          setUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || '',
            bio: '',
            lastSeen: new Date(),
            online: true,
            createdAt: new Date(),
          });
        }
      } else {
        clearUser();
      }
      setLoading(false);
    });
    return () => unsubAuth();
  }, [setUser, setLoading, clearUser]);

  return <>{children}</>;
}
