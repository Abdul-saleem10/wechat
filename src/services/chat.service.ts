import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  increment,
  startAfter,
  Timestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Chat, Message, User } from '@/types';
import { MESSAGE_LIMIT } from '@/lib/constants';

export const chatService = {
  async createChat(participants: string[]): Promise<string> {
    const existing = await this.findExistingChat(participants);
    if (existing) return existing.id;

    const chatData: Omit<Chat, 'id'> = {
      participants,
      lastMessage: null,
      unreadCount: participants.reduce((acc, p) => ({ ...acc, [p]: 0 }), {} as Record<string, number>),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      isGroup: false,
      groupName: '',
      groupAvatar: '',
      admin: '',
    };
    const docRef = await addDoc(collection(db, 'chats'), chatData);
    return docRef.id;
  },

  async createGroup(name: string, participants: string[], admin: string, avatar?: string): Promise<string> {
    const chatData: Omit<Chat, 'id'> = {
      participants,
      lastMessage: null,
      unreadCount: participants.reduce((acc, p) => ({ ...acc, [p]: 0 }), {} as Record<string, number>),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      isGroup: true,
      groupName: name,
      groupAvatar: avatar || '',
      admin,
    };
    const docRef = await addDoc(collection(db, 'chats'), chatData);
    return docRef.id;
  },

  async findExistingChat(participants: string[]): Promise<Chat | null> {
    const q = query(
      collection(db, 'chats'),
      where('participants', '==', participants.sort())
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Chat;
    }
    return null;
  },

  listenToChats(userId: string, callback: (chats: Chat[]) => void, onError?: (err: Error) => void) {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q,
      (snapshot) => {
        const chats: Chat[] = [];
        snapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() } as Chat;
          chats.push(data);
        });
        console.log(`[ChatService] listenToChats returned ${chats.length} chats:`, chats.map(c => ({ id: c.id, isGroup: c.isGroup, participants: c.participants, groupName: c.groupName })));
        callback(chats);
      },
      (error) => {
        console.error('Chat listing query failed:', error);
        if (error.message?.includes('index')) {
          console.warn(
            'Missing Firestore composite index. Create it at:',
            'https://console.firebase.google.com/project/_/firestore/indexes'
          );
        }
        onError?.(error);
      }
    );
  },

  async sendMessage(chatId: string, message: Omit<Message, 'id'>): Promise<void> {
    const msgRef = collection(db, 'chats', chatId, 'messages');
    const msgData = {
      ...message,
      createdAt: message.createdAt || serverTimestamp(),
    };
    const docRef = await addDoc(msgRef, msgData);
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: { ...msgData, id: docRef.id },
      updatedAt: serverTimestamp(),
      [`unreadCount.${message.senderId}`]: 0,
    });
    const chatSnap = await getDoc(doc(db, 'chats', chatId));
    const chat = chatSnap.data() as Chat;
    for (const pid of chat.participants) {
      if (pid !== message.senderId) {
        await updateDoc(doc(db, 'chats', chatId), {
          [`unreadCount.${pid}`]: increment(1),
        });
      }
    }
  },

  listenToMessages(chatId: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(MESSAGE_LIMIT)
    );
    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message);
      });
      callback(messages);
    });
  },

  async loadMoreMessages(chatId: string, oldestMessage: Message): Promise<Message[]> {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      startAfter(oldestMessage.createdAt),
      limit(MESSAGE_LIMIT)
    );
    const snapshot = await getDocs(q);
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as Message);
    });
    return messages.reverse();
  },

  async markAsRead(chatId: string, userId: string): Promise<void> {
    await updateDoc(doc(db, 'chats', chatId), {
      [`unreadCount.${userId}`]: 0,
    });
  },

  async updateMessageStatus(chatId: string, messageId: string, status: Message['status']): Promise<void> {
    await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), { status });
  },

  listenToUserStatus(userId: string, callback: (online: boolean, lastSeen: Timestamp | null) => void) {
    return onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback(data.online ?? false, data.lastSeen ?? null);
      }
    });
  },

  async updateTypingStatus(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    const typingRef = doc(db, 'chats', chatId, 'typing', userId);
    if (isTyping) {
      await setDoc(typingRef, { timestamp: serverTimestamp() });
    } else {
      try {
        await deleteDoc(typingRef);
      } catch {}
    }
  },

  listenToTyping(chatId: string, callback: (typingUsers: string[]) => void) {
    const q = query(collection(db, 'chats', chatId, 'typing'));
    return onSnapshot(q, (snapshot) => {
      const users: string[] = [];
      snapshot.forEach((doc) => {
        if (doc.id !== auth.currentUser?.uid) {
          users.push(doc.id);
        }
      });
      callback(users);
    });
  },

  async markMessagesAsDelivered(chatId: string, userId: string): Promise<void> {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      where('status', '==', 'sent'),
      where('senderId', '!=', userId)
    );
    const snapshot = await getDocs(q);
    const batch: Promise<void>[] = [];
    snapshot.forEach((doc) => {
      batch.push(updateDoc(doc.ref, { status: 'delivered' as const }));
    });
    await Promise.all(batch);
  },

  async searchUsers(searchTerm: string): Promise<User[]> {
    console.log(searchTerm)
    const q = query(collection(db, 'users'));
    const snapshot = await getDocs(q);
    const users: User[] = [];
    const term = searchTerm.toLowerCase();
    snapshot.forEach((doc) => {
      const data = doc.data() as User;
      if (data.name?.toLowerCase().includes(term) || data.email?.toLowerCase().includes(term)) {
        users.push({ ...data, uid: doc.id });
      }
    });
    return users;
  },

  async searchChatsForUser(userId: string, searchTerm: string): Promise<Chat[]> {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const chats: Chat[] = [];
    const term = searchTerm.toLowerCase();
    for (const docSnap of snapshot.docs) {
      const chat = { id: docSnap.id, ...docSnap.data() } as Chat;
      const otherUserId = chat.participants.find((p) => p !== userId);
      if (otherUserId) {
        const userData = await this.getUserData(otherUserId);
        if (userData && (userData.name?.toLowerCase().includes(term) || chat.lastMessage?.text?.toLowerCase().includes(term))) {
          chats.push(chat);
        }
      }
    }
    return chats;
  },

  async getUserData(uid: string): Promise<User | null> {
    const docSnap = await getDoc(doc(db, 'users', uid));
    return docSnap.exists() ? ({ ...docSnap.data(), uid: docSnap.id } as User) : null;
  },
};

import { auth } from '@/lib/firebase';
import { deleteDoc, setDoc } from 'firebase/firestore';
