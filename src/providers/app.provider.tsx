'use client';

import { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { authService } from '@/services/auth.service';
import { chatService } from '@/services/chat.service';
import { User, Chat } from '@/types';

interface AppContextType {
  refreshChats: () => void;
}

const AppContext = createContext<AppContextType>({ refreshChats: () => {} });

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { setChats, setChatUsers } = useChatStore();
  const previousUserRef = useRef<string | null>(null);
  const unsubscribeChatsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const currentUid = useAuthStore.getState().user?.uid;
    if (!currentUid) {
      if (unsubscribeChatsRef.current) {
        unsubscribeChatsRef.current();
        unsubscribeChatsRef.current = null;
      }
      setChats([]);
      previousUserRef.current = null;
      return;
    }

    if (currentUid !== previousUserRef.current) {
      if (unsubscribeChatsRef.current) {
        unsubscribeChatsRef.current();
      }
      previousUserRef.current = currentUid;

      const unsubChats = chatService.listenToChats(currentUid, async (chats: Chat[]) => {
        setChats(chats);
        const userIds = new Set<string>();
        chats.forEach((c) => c.participants.forEach((p) => { if (p !== currentUid) userIds.add(p); }));
        const userMap: Record<string, User> = {};
        for (const uid of userIds) {
          try {
            const userData = await authService.getUserData(uid);
            if (userData) userMap[uid] = userData;
          } catch {}
        }
        setChatUsers(userMap);
      });
      unsubscribeChatsRef.current = unsubChats;

      return () => {
        unsubChats();
        unsubscribeChatsRef.current = null;
      };
    }
  }, [useAuthStore.getState().user?.uid, setChats, setChatUsers]);

  const refreshChats = useCallback(() => {
    const uid = useAuthStore.getState().user?.uid;
    if (uid && unsubscribeChatsRef.current) {
      unsubscribeChatsRef.current();
      const unsub = chatService.listenToChats(uid, async (chats: Chat[]) => {
        setChats(chats);
      });
      unsubscribeChatsRef.current = unsub;
    }
  }, [setChats]);

  return <AppContext.Provider value={{ refreshChats }}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
