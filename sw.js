// Skip waiting during installation
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
  console.log('Service Worker installed');
});

// Claim clients immediately during activation
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
  console.log('Service Worker activated');
});

// Bypass cache for all network requests
self.addEventListener('fetch', event => {
  // Always fetch from network, don't cache
  event.respondWith(fetch(event.request));
});