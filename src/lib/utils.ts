import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isYesterday } from 'date-fns';
import type { TimestampValue } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isServerTimestamp(value: any): boolean {
  return value && typeof value === 'object' && 'toMillis' in value;
}

export function formatMessageTime(timestamp: any): string {
  if (!timestamp || isServerTimestamp(timestamp)) return '';
  const date = timestampToDate(timestamp);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MM/dd/yy');
}

export function formatLastSeen(timestamp: any): string {
  if (!timestamp || isServerTimestamp(timestamp)) return '';
  const date = timestampToDate(timestamp);
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return format(date, 'MMM d');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function timestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'number') return new Date(timestamp);
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000);
  }
  if (timestamp && typeof timestamp === 'object' && 'toMillis' in timestamp) {
    return new Date(timestamp.toMillis());
  }
  return new Date();
}

export function timestampToMillis(timestamp: any): number {
  return timestampToDate(timestamp).getTime();
}

export function isValidFileSize(size: number, maxMB: number = 10): boolean {
  return size <= maxMB * 1024 * 1024;
}

export function getFileType(mimeType: string): 'image' | 'video' | 'document' | 'audio' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}
