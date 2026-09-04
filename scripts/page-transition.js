// ============================================
// TRANSICIÓN ENTRE PÁGINAS — "polvo estelar"
// ============================================
// Al salir de una página: el contenido se desvanece + un estallido de
// partículas doradas se dispersa desde el centro (como si se deshiciera
// en polvo). Al entrar a la nueva página: el contenido aparece con un
// fundido suave mientras las partículas convergen hacia el centro (como
// si se estuviera "armando" desde ese mismo polvo).
//
// Nota honesta: esto NO es un cubo 3D ni descompone los píxeles reales
// de la página (eso requeriría capturar la pantalla con una librería
// extra tipo html2canvas + WebGL, mucho más pesado). Es una animación
// de partículas + fundido que da la sensación de "disolverse y
// reconstruirse", que es lo más cercano y liviano sin agregar
// dependencias externas al proyecto.

(() => {
  const DURATION_LEAVE = 550;
  const DURATION_ENTER = 600;

  let canvas, ctx, W, H, dpr;
  let particles = [];

  function ensureCanvas() {
    canvas = document.getElementById('transitionCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'transitionCanvas';
      document.body.appendChild(canvas);
    }
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const rand = (a, b) => a + Math.random() * (b - a);

  function spawnParticles(mode) {
    particles = [];
    const cx = W / 2, cy = H / 2;
    const count = 90;
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const radius = rand(0, Math.max(W, H) * 0.5);
      const startX = mode === 'leave' ? cx : cx + Math.cos(angle) * radius;
      const startY = mode === 'leave' ? cy : cy + Math.sin(angle) * radius;
      particles.push({
        x: startX, y: startY,
        targetX: mode === 'leave' ? cx + Math.cos(angle) * radius : cx,
        targetY: mode === 'leave' ? cy + Math.sin(angle) * radius : cy,
        r: rand(1, 3),
        mode
      });
    }
  }

  function renderLoop(startTime, duration) {
    const now = performance.now();
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3);

    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      const x = p.x + (p.targetX - p.x) * eased;
      const y = p.y + (p.targetY - p.y) * eased;
      const alpha = p.mode === 'leave' ? (1 - eased) : eased;
      ctx.beginPath();
      ctx.fillStyle = `rgba(201,168,118,${alpha.toFixed(2)})`;
      ctx.shadowColor = 'rgba(201,168,118,0.8)';
      ctx.shadowBlur = 6;
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    if (t < 1) {
      requestAnimationFrame(() => renderLoop(startTime, duration));
    } else {
      ctx.clearRect(0, 0, W, H);
    }
  }

  function playEnter() {
    ensureCanvas();
    spawnParticles('enter');
    document.body.classList.add('page-entering');
    renderLoop(performance.now(), DURATION_ENTER);
    setTimeout(() => {
      document.body.classList.remove('page-entering');
    }, DURATION_ENTER);
  }

  function playLeaveThenNavigate(href) {
    ensureCanvas();
    spawnParticles('leave');
    document.body.classList.add('page-leaving');
    renderLoop(performance.now(), DURATION_LEAVE);
    setTimeout(() => {
      window.location.href = href;
    }, DURATION_LEAVE);
  }

  document.addEventListener('DOMContentLoaded', () => {
    playEnter();

    // Intercepta los enlaces de navegación interna para animar la salida
    document.querySelectorAll('nav a[href$=".html"]').forEach(link => {
      link.addEventListener('click', (evt) => {
        const href = link.getAttribute('href');
        const current = window.location.pathname.split('/').pop() || 'index.html';
        if (href === current) return; // ya estás en esa página, no animar
        evt.preventDefault();
        playLeaveThenNavigate(href);
      });
    });
  });
})();
