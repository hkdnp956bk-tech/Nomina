// Cambia el número de versión cada vez que actualices index.html
const CACHE = 'nomina-v8';
const FILES = ['./', './index.html', './manifest.json', './icon-180.png', './icon-512.png', './pdf.min.js', './pdf.worker.min.js'];
// Lector de capturas (se descarga la primera vez y se guarda)
const LIBS = ['cdn.jsdelivr.net', 'tessdata.projectnaptha.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE && k !== 'nomina-libs').map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (LIBS.includes(url.hostname)) {
    e.respondWith(caches.open('nomina-libs').then(c => c.match(e.request).then(hit => hit ||
      fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  // Solo guarda los archivos de la propia app; las conexiones con GitHub (sincronización) no se guardan
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
