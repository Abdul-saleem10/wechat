'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { isNotificationSupported, requestNotificationPermission } from '@/lib/fcm';
import toast from 'react-hot-toast';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const chats = useChatStore((s) => s.chats);
  const chatUsers = useChatStore((s) => s.chatUsers);
  const selectedChatId = useChatStore((s) => s.selectedChatId);
  const prevUnreadRef = useRef<Record<string, number>>({});
  const promptedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (!isNotificationSupported()) return;

    if (Notification.permission === 'granted') {
      requestNotificationPermission(user.uid);
    } else if (Notification.permission === 'default' && !promptedRef.current) {
      promptedRef.current = true;
      setTimeout(() => requestNotificationPermission(user.uid), 5000);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    chats.forEach((chat) => {
      const unread = chat.unreadCount?.[user.uid] || 0;
      const prev = prevUnreadRef.current[chat.id] || 0;
      prevUnreadRef.current[chat.id] = unread;

      if (unread > prev && chat.id !== selectedChatId) {
        const otherUid = chat.participants.find((p) => p !== user.uid);
        const otherUser = otherUid ? chatUsers[otherUid] : null;
        const name = otherUser?.name || 'Someone';
        const text = chat.lastMessage?.text || 'New message';

        if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(name, {
              body: text,
              icon: otherUser?.avatar || '/favicon.ico',
              badge: '/favicon.ico',
              tag: chat.id,
              data: { chatId: chat.id },
            });
          });
        } else {
          toast(`${name}: ${text}`, {
            duration: 4000,
            icon: '💬',
            style: { borderRadius: '10px', background: '#1a1a2e', color: '#fff' },
          });
        }
      }
    });
  }, [chats, user, chatUsers, selectedChatId]);

  return <>{children}</>;
}
