// ============================================
// CROMADE - SERVICE WORKER (Offline)
// ============================================

const CACHE_NAME = 'cromade-v1';
const urlsToCache = [
  '/cromade/',
  '/cromade/index.html',
  '/cromade/styles.css',
  '/cromade/app.js',
  '/cromade/data.js',
  '/cromade/landing.html',
  '/cromade/landing.css',
  '/cromade/landing.js'
];

// Instalar: guardar archivos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activar: limpiar cachés viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: responder desde caché o red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devolver de caché si existe
        if (response) {
          return response;
        }
        // Si no, ir a la red
        return fetch(event.request)
          .then(networkResponse => {
            // Guardar en caché para la próxima vez
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, clone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Si falla la red y no hay caché, mostrar offline
            return new Response('Sin conexión. Algunos contenidos pueden no estar disponibles.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});
