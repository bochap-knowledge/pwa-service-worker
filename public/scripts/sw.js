const staticCacheName = 'sw-static-v1';
const dynamicCacheName = 'sw-dynamic';

const staticResources = [
  'index.html',
  'when.html',
  'scripts/index-controller.js',
  'images/main_left_bottom.png',
  'images/main_left_middle.png',
  'images/main_left_top.png',
  'images/main_right.png',
  'images/when.png',
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

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin === location.origin) {
      // Redirect 'http://localhost:8000' to 'http://localhost:8000/index.html' since 
      // they should bascially be the same html
      if (requestUrl.pathname === '/') {
          event.respondWith(caches.match('index.html'));
          return;
      }

      if (requestUrl.pathname === '/when.html') {
        fetch('http://localhost:8000/api/kill/')
          .then((response) => {
            console.log('Server killed');
          })
          .catch((error) => {
            console.log('Server killed');
          });

        event.respondWith(caches.match('when.html'));
        return;  
      }
  }

  event.respondWith(
    fetch(event.request).then(function(networkResponse) {
      return networkResponse;
    })
    .catch(function(error) {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.updated) {
      self.skipWaiting();
  }
});

self.addEventListener('push', function(event) {
  let body;
  if (event.data) {
    body = event.data.text();
  } else {
    body = 'Push message no payload';
  }

  const options = {
    body: body,
    icon: 'images/northatlantajs.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  event.waitUntil(
    self.registration.showNotification('Push Notification', options)
  );
});