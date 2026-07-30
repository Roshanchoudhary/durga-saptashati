const CACHE = 'durga-saptashati-v1';
const ASSETS = [
  '/',
  '/styles/global.css',
  '/scripts/theme.js',
  '/scripts/sw-register.js',
  '/manifest.webmanifest',
  '/images/logo.svg',
  '/icons/favicon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // Skip Pagefind
  if (url.pathname.includes('/pagefind/')) {
    e.respondWith(fetch(e.request));
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      
      return fetch(e.request).then(res => {
        if (res.headers.get('content-type')?.includes('text/html')) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      });
    }).catch(() => new Response('Offline', { status: 503 }))
  );
});