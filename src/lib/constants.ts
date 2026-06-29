export const STORAGE_KEYS = {
  THEME: 'wechat-theme',
  USER: 'wechat-user',
} as const;

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  CHAT: '/chat',
} as const;

export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  CHATS: 'chats',
  MESSAGES: 'messages',
} as const;

export const MESSAGE_LIMIT = 50;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const TYPING_TIMEOUT = 3000;
export const DEBOUNCE_DELAY = 300;
