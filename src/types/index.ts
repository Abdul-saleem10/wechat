import { FieldValue } from 'firebase/firestore';

export type ServerTimestamp = FieldValue;

export interface User {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  lastSeen: TimestampValue | ServerTimestamp;
  online: boolean;
  createdAt: TimestampValue | ServerTimestamp;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: Message | null;
  unreadCount: Record<string, number>;
  updatedAt: TimestampValue | ServerTimestamp;
  createdAt: TimestampValue | ServerTimestamp;
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
  admin?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  type: MessageType;
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: number;
  duration?: number;
  status: MessageStatus;
  createdAt: TimestampValue | ServerTimestamp;
}

export type MessageType = 'text' | 'image' | 'video' | 'document' | 'voice';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface TypingUser {
  userId: string;
  chatId: string;
  timestamp: number;
}

export type TimestampValue = { seconds: number; nanoseconds: number } | Date | number;
