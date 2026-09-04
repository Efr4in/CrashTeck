// ============================================
// SERVICE WORKER — muestra 404.html en vez del error nativo del
// navegador cuando no hay conexión a internet.
// ============================================
// LÍMITES REALES (no hay forma de evitarlos, son del navegador/web):
//  1. Solo funciona sobre HTTPS (o localhost). NO funciona abriendo los
//     archivos con doble clic (file://) — eso es normal, pruébalo recién
//     cuando esté desplegado en Vercel.
//  2. Solo puede mostrar la 404 offline si el sitio ya se visitó al
//     menos una vez CON conexión antes (así el navegador alcanza a
//     guardar los archivos). La primerísima visita de alguien sin
//     conexión no puede mostrar nada — ninguna web puede evitar eso.

const CACHE_NAME = 'crashtech-cache-v1';
const OFFLINE_URL = '404.html';

// Lo mínimo para que la 404 se vea bien incluso sin conexión
const PRECACHE_ASSETS = [
  '404.html',
  'styles/base.css',
  'styles/404.css',
  'scripts/space-bg.js',
  'img/crash-hero.png',
  'img/favicon-32.png',
  'img/favicon-16.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Solo nos interesa interceptar navegación entre páginas (cargar/recargar
  // una URL), no cada pedido de imagen o script suelto.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached || Response.error())
      )
    );
  }
});
