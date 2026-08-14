// Service worker do ImportaFácil — PWA + Web Push
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Novo lead recebido!', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Novo lead recebido!';
  const options = {
    body: data.body || 'Um novo lead acabou de preencher o formulário',
    icon: data.icon || '/favicon.png',
    badge: '/favicon.png',
    tag: data.tag || 'novo-lead',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || '/admin' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/admin';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(url).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
