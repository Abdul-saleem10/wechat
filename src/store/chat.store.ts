import { create } from 'zustand';
import { Chat, Message, User } from '@/types';

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  chatUsers: Record<string, User>;
  typingUsers: string[];
  selectedChatId: string | null;
  setChats: (chats: Chat[]) => void;
  setCurrentChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setChatUsers: (users: Record<string, User>) => void;
  updateChatUser: (uid: string, data: Partial<User>) => void;
  setTypingUsers: (users: string[]) => void;
  setSelectedChatId: (id: string | null) => void;
  updateChatLastMessage: (chatId: string, message: Message) => void;
  markChatRead: (chatId: string, userId: string) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  currentChat: null,
  messages: [],
  chatUsers: {},
  typingUsers: [],
  selectedChatId: null,
  setChats: (chats) => set({ chats }),
  setCurrentChat: (currentChat) => set({ currentChat }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setChatUsers: (chatUsers) => set({ chatUsers }),
  updateChatUser: (uid, data) =>
    set((state) => ({
      chatUsers: {
        ...state.chatUsers,
        [uid]: { ...(state.chatUsers[uid] || {}), ...data } as User,
      },
    })),
  setTypingUsers: (typingUsers) => set({ typingUsers }),
  setSelectedChatId: (selectedChatId) => set({ selectedChatId }),
  updateChatLastMessage: (chatId, message) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, lastMessage: message } : c
      ),
    })),
  markChatRead: (chatId, userId) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: { ...c.unreadCount, [userId]: 0 } } : c
      ),
    })),
  clearChat: () =>
    set({
      currentChat: null,
      messages: [],
      typingUsers: [],
      selectedChatId: null,
    }),
}));
