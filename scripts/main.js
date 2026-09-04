// ============================================
// Compartido por todas las páginas
// ============================================

// Loading screen — anillo circular rápido + "Big Bang" de chispas al completar.
// Solo se muestra una vez por sesión (al abrir o refrescar), no al navegar entre páginas.
(() => {
  const loader = document.getElementById('loader');
  if (!loader) return;

  const ringWrap = loader.querySelector('.loader-ring-wrap');
  const RING_DURATION = 1700;  // debe coincidir con la animación CSS ring-fill
  const SHRINK_DURATION = 380; // debe coincidir con la transición de .pop

  function spawnSparkBurst() {
    const count = 26;
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('div');
      spark.className = 'loader-spark';
      const angle = Math.random() * Math.PI * 2;
      const distance = 120 + Math.random() * 220;
      spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      spark.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      spark.style.animationDelay = (Math.random() * 0.08) + 's';
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 700);
    }
  }

  function explodeAndHide() {
    // 1. la imagen se encoge hasta convertirse en un punto
    ringWrap.classList.add('pop');
    // 2. justo cuando llega al punto, estalla en chispas
    setTimeout(() => {
      spawnSparkBurst();
      loader.classList.add('hide');
      sessionStorage.setItem('crashtechLoaded', '1');
    }, SHRINK_DURATION);
  }

  if (sessionStorage.getItem('crashtechLoaded')) {
    // Ya se mostró antes en esta sesión: se oculta de inmediato, sin animación
    loader.style.transition = 'none';
    loader.classList.add('hide');
    return;
  }

  window.addEventListener('load', () => {
    setTimeout(explodeAndHide, RING_DURATION);
  });
})();

// Scroll reveal
document.addEventListener('DOMContentLoaded', () => {
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in');
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // Marca el link de nav activo según la página actual
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === path);
  });

  // Protección básica de imágenes: sin arrastre, sin menú de "Guardar imagen como..."
  document.querySelectorAll('img').forEach(img => img.setAttribute('draggable', 'false'));
  document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });

  // Menú móvil (hamburguesa) — overlay independiente, fuera del header
  const navToggle = document.getElementById('navToggle');
  const mobileOverlay = document.getElementById('mobileNavOverlay');
  if (navToggle && mobileOverlay) {
    navToggle.addEventListener('click', () => {
      const isOpen = mobileOverlay.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    mobileOverlay.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileOverlay.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
});

// Registro del service worker (fallback offline -> 404.html).
// No hace nada sobre file://; solo se activa una vez desplegado en HTTPS.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Silencioso a propósito: en file:// o sin HTTPS esto siempre falla,
      // y no es un error real que el usuario deba ver.
    });
  });
}
