// Service Worker for Golden Hour Finder
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Golden Hour Finder';
  const options = {
    body: data.body || 'Something beautiful is happening...',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data.url
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Open app or specific URL
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
