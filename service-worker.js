const CACHE_NAME = 'joy-bimbel-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // Skip non-GET
  if (req.method !== 'GET') return;

  // Skip Supabase (auth/API/storage) - jangan di-cache
  if (req.url.includes('supabase.co')) return;

  // Network-first untuk HTML & manifest (biar selalu dapat versi terbaru)
  if (req.headers.get('accept')?.includes('text/html') || req.url.endsWith('manifest.json')) {
    e.respondWith(
      fetch(req).then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, resClone));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first untuk asset lainnya (CDN, gambar, dll)
  e.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req).then(res => {
        if (res.ok) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, resClone));
        }
        return res;
      });
    })
  );
});
