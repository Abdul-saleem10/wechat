import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, db, hasConfig } from '@/lib/firebase';

let messaging: ReturnType<typeof getMessaging> | null = null;

function getMessagingInstance() {
  if (!messaging && hasConfig && app) {
    try {
      messaging = getMessaging(app);
    } catch {}
  }
  return messaging;
}

export async function requestNotificationPermission(userId: string): Promise<boolean> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const msg = getMessagingInstance();
    if (!msg) return false;

    const token = await getToken(msg, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await registerSW(),
    });

    if (token && db) {
      await setDoc(doc(db, 'users', userId), { fcmToken: token }, { merge: true });
    }

    return true;
  } catch {
    return false;
  }
}

async function registerSW(): Promise<ServiceWorkerRegistration> {
  const swUrl = '/api/fcm-sw';
  const existing = await navigator.serviceWorker.getRegistration(swUrl);
  if (existing) return existing;
  return navigator.serviceWorker.register(swUrl, { scope: '/' });
}

export function onForegroundMessage(callback: (payload: any) => void) {
  const msg = getMessagingInstance();
  if (!msg) return () => {};
  return onMessage(msg, (payload) => {
    callback(payload);
  });
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}
