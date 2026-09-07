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
//  3. Las tipografías (Fraunces/Manrope) vienen de Google Fonts, un
//     servicio externo — sin conexión, el texto usa la fuente por
//     defecto del sistema en vez de las tuyas. Es un detalle menor,
//     el diseño y el fondo espacial animado sí se ven completos.

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
  // Estrategia: primero la copia guardada (si la tenemos, es instantánea y
  // funciona sin conexión); si no está guardada, intentamos la red. Si
  // estamos navegando a una página y ambas cosas fallan, mostramos la 404.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        return Response.error();
      });
    })
  );
});
