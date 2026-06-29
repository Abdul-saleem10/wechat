importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY,
  authDomain: self.FIREBASE_AUTH_DOMAIN,
  projectId: self.FIREBASE_PROJECT_ID,
  storageBucket: self.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
  appId: self.FIREBASE_APP_ID,
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { notification, data } = payload;
  const title = notification?.title || 'New message';
  const body = notification?.body || '';
  const icon = '/favicon.ico';

  self.registration.showNotification(title, {
    body,
    icon,
    badge: icon,
    data: data || {},
    vibrate: [200, 100, 200],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL('/chat', self.location.origin);
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen.href && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
