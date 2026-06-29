'use client';

import { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { authService } from '@/services/auth.service';
import { chatService } from '@/services/chat.service';
import { User, Chat } from '@/types';
import toast from 'react-hot-toast';

interface AppContextType {
  refreshChats: () => void;
}

const AppContext = createContext<AppContextType>({ refreshChats: () => {} });

export function AppProvider({ children }: { children: React.ReactNode }) {
  const uid = useAuthStore((s) => s.user?.uid);
  const { setChats, setChatUsers } = useChatStore();
  const unsubscribeChatsRef = useRef<(() => void) | null>(null);
  const previousUidRef = useRef<string | null | undefined>(null);

  console.log('[AppProvider] render, uid:', uid);

  useEffect(() => {
    console.log('[AppProvider] effect run, uid:', uid, 'previousUidRef:', previousUidRef.current);

    if (!uid) {
      console.log('[AppProvider] no uid, clearing chats');
      if (unsubscribeChatsRef.current) {
        unsubscribeChatsRef.current();
        unsubscribeChatsRef.current = null;
      }
      setChats([]);
      previousUidRef.current = undefined;
      return;
    }

    if (uid === previousUidRef.current) {
      console.log('[AppProvider] uid unchanged, skipping');
      return;
    }
    previousUidRef.current = uid;

    if (unsubscribeChatsRef.current) {
      console.log('[AppProvider] cleaning up old listener');
      unsubscribeChatsRef.current();
    }

    console.log('[AppProvider] setting up listener for uid:', uid);
    const unsubChats = chatService.listenToChats(
      uid,
      async (chats: Chat[]) => {
        console.log('[AppProvider] got chats:', chats.length);
        setChats(chats);
        const userIds = new Set<string>();
        chats.forEach((c) => c.participants.forEach((p) => { if (p !== uid) userIds.add(p); }));
        const userMap: Record<string, User> = {};
        for (const otherUid of userIds) {
          try {
            const userData = await authService.getUserData(otherUid);
            if (userData) userMap[otherUid] = userData;
          } catch {}
        }
        setChatUsers(userMap);
      },
      (error) => {
        console.error('[AppProvider] listenToChats error:', error);
        toast.error(
          'Chats failed to load. Check console for Firestore index instructions.',
          { duration: 6000 }
        );
      }
    );
    unsubscribeChatsRef.current = unsubChats;

    return () => {
      console.log('[AppProvider] cleanup');
      unsubChats();
      unsubscribeChatsRef.current = null;
      previousUidRef.current = null;
    };
  }, [uid, setChats, setChatUsers]);

  const refreshChats = useCallback(() => {
    if (!uid) return;
    if (unsubscribeChatsRef.current) {
      unsubscribeChatsRef.current();
    }
    const unsub = chatService.listenToChats(uid, async (chats: Chat[]) => {
      setChats(chats);
    });
    unsubscribeChatsRef.current = unsub;
  }, [uid, setChats]);

  return <AppContext.Provider value={{ refreshChats }}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
