const staticCacheName = 'sw-static-v2';
const dynamicCacheName = 'sw-dynamic';

const staticResources = [
  'index.html',
  'scripts/sw-controller.js',
  'images/main.png',
  'styles/index.css',
  'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
  'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
];

const allCaches = [
  staticCacheName, dynamicCacheName
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(staticCacheName)
      .then((cache) => cache.addAll(staticResources))
  )
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
      caches.keys().then(function (cacheNames) {
          return Promise.all(
              cacheNames.filter(function (cacheName) {
                  return cacheName.startsWith('sw-') && !allCaches.includes(cacheName);
              })
              .map(function (cacheName) {
                  return caches.delete(cacheName);
              })
          );
      })
  );
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.updated) {
      self.skipWaiting();
  }
});