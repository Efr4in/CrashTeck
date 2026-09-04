// ============================================
// FONDO ESPACIAL — Inicio (v2)
// Estrellas + nebulosas + asteroides de colores (algunos habitados) +
// sol/luna según la hora real + OVNI y cometas rarísimos + estela del cursor.
// Todo en <canvas>, sin librerías externas.
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('spaceCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // ---------- Config general ----------
  const STAR_COUNT = 150;
  const NEBULA_COUNT = 3;
  const ASTEROID_COUNT = 7;
  const INHABITED_COUNT = 2;        // cuántos asteroides iniciales tienen "vida"
  const MIN_ASTEROID_RADIUS = 10;
  const HITS_TO_EXPLODE = 5;
  const TRAIL_MAX_POINTS = 40;
  const UFO_CHECK_INTERVAL = 9000;
  const UFO_SPAWN_CHANCE = 0.12;
  const COMET_CHECK_INTERVAL = 6000;
  const COMET_SPAWN_CHANCE = 0.18;

  const INHABITED_PHRASES = [
    '¡Hogar dulce hogar, no lo sacudas!',
    'Aquí vivo yo, ten modales 🏠',
    '¿Turista? Bienvenido, pero con calma',
    '¡Cuidado con mis plantas espaciales!',
    'Un clic más y llamo a seguridad 👀',
    'Cómodo aquí arriba, gracias por preguntar'
  ];
  const EVACUATION_PHRASES = [
    '¡Me mudo a otro asteroide! 🛸',
    '¡Esto es un desalojo forzoso!',
    '¡Avisen a mi seguro espacial!'
  ];

  // ---------- Temas de color (variedad de "minerales") ----------
  const ASTEROID_THEMES = [
    { name: 'roca',      base: '#5C5650', shade: '#2B2822' },
    { name: 'hielo',     base: '#6FA9C9', shade: '#1F3B4A' },
    { name: 'óxido',     base: '#C97B4A', shade: '#5A311C' },
    { name: 'amatista',  base: '#9B6FB0', shade: '#3A2350' },
    { name: 'musgo',     base: '#7FA85C', shade: '#2C3F1E' },
    { name: 'obsidiana', base: '#4A4A54', shade: '#15151A' }
  ];

  let W = 0, H = 0, dpr = 1;

  let stars = [];
  let nebulas = [];
  let asteroids = [];
  let particles = [];  // debris + estela del cursor + cometas
  let ufo = null;

  let mouse = { x: -999, y: -999, lastX: -999, lastY: -999 };

  // ---------- Utilidades ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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

  // ---------- Ciclo día / noche (según la hora real del equipo) ----------
  function getTimePhase() {
    const h = new Date().getHours();
    if (h >= 6 && h < 16) return 'day';       // sol fuerte, brillo notorio
    if (h >= 16 && h < 19) return 'sunset';   // luz degradada, más sutil
    return 'night';                            // oscuro, luna, más protagonismo del cielo
  }

  const phase = getTimePhase();

  const PHASE_CONFIG = {
    day:    { skyTint: 'rgba(201,168,118,0.05)', lightBoost: 0.55, bodyColor: '#F0E2C9', bodyGlow: 'rgba(240,226,201,0.55)', bodyPos: { x: 0.86, y: 0.14 }, starAlphaMul: 0.55 },
    sunset: { skyTint: 'rgba(201,122,90,0.06)',  lightBoost: 0.28, bodyColor: '#E08B5B', bodyGlow: 'rgba(224,139,91,0.4)',   bodyPos: { x: 0.82, y: 0.22 }, starAlphaMul: 0.8 },
    night:  { skyTint: 'rgba(20,26,40,0.15)',    lightBoost: 0.08, bodyColor: '#DCE3EE', bodyGlow: 'rgba(220,227,238,0.3)',  bodyPos: { x: 0.14, y: 0.12 }, starAlphaMul: 1 }
  };
  const cfg = PHASE_CONFIG[phase];

  // ---------- Estrellas ----------
  function makeStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: rand(0, W), y: rand(0, H),
        r: rand(0.4, 1.6),
        baseAlpha: rand(0.25, 0.9),
        twinkleSpeed: rand(0.5, 2),
        phase: rand(0, Math.PI * 2),
        driftX: rand(-2, 2) / 60
      });
    }
  }

  // ---------- Nebulosas (profundidad decorativa) ----------
  const NEBULA_COLORS = ['80,120,180', '150,90,180', '196,150,90'];
  function makeNebulas() {
    nebulas = [];
    for (let i = 0; i < NEBULA_COUNT; i++) {
      nebulas.push({
        x: rand(0, W), y: rand(0, H),
        r: rand(120, 220),
        color: NEBULA_COLORS[i % NEBULA_COLORS.length],
        driftX: rand(-3, 3) / 200,
        driftY: rand(-2, 2) / 200,
        alpha: rand(0.05, 0.09)
      });
    }
  }

  // ---------- Asteroides ----------
  function makeAsteroidShape(radius) {
    const points = [];
    const n = Math.floor(rand(8, 12));
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2;
      points.push({ angle, r: radius * rand(0.72, 1.12) });
    }
    const craters = [];
    const craterCount = Math.floor(rand(1, 3));
    for (let i = 0; i < craterCount; i++) {
      craters.push({
        x: rand(-radius * 0.4, radius * 0.4),
        y: rand(-radius * 0.4, radius * 0.4),
        r: rand(radius * 0.12, radius * 0.22)
      });
    }
    return { points, craters };
  }

  function spawnAsteroid(opts) {
    const radius = opts.radius;
    const theme = opts.theme || ASTEROID_THEMES[Math.floor(rand(0, ASTEROID_THEMES.length))];
    asteroids.push({
      x: opts.x !== undefined ? opts.x : rand(radius, W - radius),
      y: opts.y !== undefined ? opts.y : rand(radius, H - radius),
      radius,
      vx: opts.vx !== undefined ? opts.vx : rand(-0.25, 0.25),
      vy: opts.vy !== undefined ? opts.vy : rand(-0.15, 0.15),
      rotation: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.006, 0.006),
      hits: 0,
      flash: 0,
      theme,
      inhabited: !!opts.inhabited,
      habitatAngle: rand(0, Math.PI * 2),
      blinkPhase: rand(0, Math.PI * 2),
      spawnTime: performance.now(),
      shape: makeAsteroidShape(radius)
    });
  }

  function makeAsteroids() {
    asteroids = [];
    const inhabitedIdx = new Set();
    while (inhabitedIdx.size < INHABITED_COUNT && inhabitedIdx.size < ASTEROID_COUNT) {
      inhabitedIdx.add(Math.floor(rand(0, ASTEROID_COUNT)));
    }
    for (let i = 0; i < ASTEROID_COUNT; i++) {
      spawnAsteroid({
        radius: rand(24, 42),
        inhabited: inhabitedIdx.has(i)
      });
      asteroids[asteroids.length - 1].spawnTime = performance.now() + rand(0, 400);
    }
  }

  function explodeAsteroid(a) {
    for (let i = 0; i < 16; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(0.6, 2.4);
      particles.push({
        type: 'debris',
        x: a.x, y: a.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        r: rand(1.5, 3.5), life: 1, decay: rand(0.015, 0.03),
        color: '201,168,118'
      });
    }
    const childRadius = a.radius * 0.55;
    if (childRadius >= MIN_ASTEROID_RADIUS) {
      const pieces = 2 + Math.floor(rand(0, 2));
      for (let i = 0; i < pieces; i++) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(0.4, 1);
        spawnAsteroid({
          x: a.x + Math.cos(angle) * 6, y: a.y + Math.sin(angle) * 6,
          radius: childRadius,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          inhabited: false
        });
      }
    }
  }

  // ---------- OVNI ----------
  let ufoTimer = 0;
  function maybeSpawnUFO(dt) {
    if (ufo) return;
    ufoTimer += dt;
    if (ufoTimer >= UFO_CHECK_INTERVAL) {
      ufoTimer = 0;
      if (Math.random() < UFO_SPAWN_CHANCE) {
        const fromLeft = Math.random() > 0.5;
        ufo = {
          x: fromLeft ? -60 : W + 60,
          y: rand(H * 0.12, H * 0.4),
          vx: (fromLeft ? 1 : -1) * rand(1.4, 2.2),
          wobblePhase: 0, blink: 0
        };
      }
    }
  }

  // ---------- Cometa (distinto del OVNI: solo un destello rápido con estela) ----------
  let cometTimer = 0;
  function maybeSpawnComet(dt) {
    cometTimer += dt;
    if (cometTimer >= COMET_CHECK_INTERVAL) {
      cometTimer = 0;
      if (Math.random() < COMET_SPAWN_CHANCE) {
        const startX = rand(0, W * 0.4);
        const startY = rand(0, H * 0.3);
        const speed = rand(6, 9);
        const angle = rand(0.5, 0.9);
        particles.push({
          type: 'comet',
          x: startX, y: startY,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          r: 2.4, life: 1, decay: 0.012,
          color: '240,226,201'
        });
      }
    }
  }

  // ---------- Interacción: clics ----------
  function handleClick(evt) {
    const x = evt.clientX;
    const y = evt.clientY;

    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (dist(x, y, a.x, a.y) <= a.radius + 4) {
        a.hits++;
        a.flash = 1;
        const angle = Math.atan2(a.y - y, a.x - x);
        a.vx += Math.cos(angle) * 0.6;
        a.vy += Math.sin(angle) * 0.6;

        for (let p = 0; p < 5; p++) {
          particles.push({
            type: 'debris', x, y,
            vx: rand(-1, 1), vy: rand(-1, 1),
            r: rand(1, 2), life: 1, decay: 0.04,
            color: '240,226,201'
          });
        }

        if (a.inhabited && a.hits < HITS_TO_EXPLODE) {
          showSpaceBubble(a.x, a.y - a.radius, INHABITED_PHRASES[Math.floor(rand(0, INHABITED_PHRASES.length))]);
        }

        if (a.hits >= HITS_TO_EXPLODE) {
          if (a.inhabited) {
            showSpaceBubble(a.x, a.y - a.radius, EVACUATION_PHRASES[Math.floor(rand(0, EVACUATION_PHRASES.length))]);
          }
          explodeAsteroid(a);
          asteroids.splice(i, 1);
        }
        return;
      }
    }
  }

  function showSpaceBubble(x, y, text) {
    const bubble = document.createElement('div');
    bubble.className = 'space-bubble';
    bubble.textContent = text;
    bubble.style.left = x + 'px';
    bubble.style.top = y + 'px';
    document.body.appendChild(bubble);
    requestAnimationFrame(() => bubble.classList.add('show'));
    setTimeout(() => {
      bubble.classList.remove('show');
      bubble.classList.add('hide');
      setTimeout(() => bubble.remove(), 400);
    }, 2200);
  }

  // ---------- Estela del cursor ----------
  function handleMouseMove(evt) {
    mouse.x = evt.clientX;
    mouse.y = evt.clientY;

    if (dist(mouse.x, mouse.y, mouse.lastX, mouse.lastY) > 3) {
      particles.push({
        type: 'trail', x: mouse.x, y: mouse.y,
        r: rand(1.2, 2.2), life: 1, decay: 0.035,
        color: '240,226,201'
      });
      const trailCount = particles.filter(p => p.type === 'trail').length;
      if (trailCount > TRAIL_MAX_POINTS) {
        const idx = particles.findIndex(p => p.type === 'trail');
        if (idx !== -1) particles.splice(idx, 1);
      }
      mouse.lastX = mouse.x;
      mouse.lastY = mouse.y;
    }
  }
  function handleMouseLeave() { mouse.x = -999; mouse.y = -999; }

  // ---------- Update ----------
  function wrap(obj, margin) {
    if (obj.x < -margin) obj.x = W + margin;
    if (obj.x > W + margin) obj.x = -margin;
    if (obj.y < -margin) obj.y = H + margin;
    if (obj.y > H + margin) obj.y = -margin;
  }

  function update(dt) {
    stars.forEach(s => {
      s.x += s.driftX;
      if (s.x < 0) s.x = W;
      if (s.x > W) s.x = 0;
    });

    nebulas.forEach(n => {
      n.x += n.driftX;
      n.y += n.driftY;
      wrap(n, n.r);
    });

    asteroids.forEach(a => {
      a.x += a.vx; a.y += a.vy;
      a.rotation += a.rotSpeed;
      a.vx *= 0.995; a.vy *= 0.995;
      if (a.flash > 0) a.flash -= 0.06;
      wrap(a, a.radius + 10);
    });

    maybeSpawnUFO(dt);
    if (ufo) {
      ufo.x += ufo.vx;
      ufo.wobblePhase += 0.05;
      ufo.blink += 0.15;
      if (ufo.x < -80 || ufo.x > W + 80) ufo = null;
    }

    maybeSpawnComet(dt);

    particles.forEach(p => {
      p.x += p.vx || 0;
      p.y += p.vy || 0;
      p.life -= p.decay;
    });
    particles = particles.filter(p => p.life > 0);
  }

  // ---------- Draw ----------
  function drawSky() {
    ctx.fillStyle = cfg.skyTint;
    ctx.fillRect(0, 0, W, H);
  }

  function drawCelestialBody() {
    const bx = W * cfg.bodyPos.x;
    const by = H * cfg.bodyPos.y;
    const r = phase === 'day' ? 30 : 22;

    const glow = ctx.createRadialGradient(bx, by, 0, bx, by, r * 4);
    glow.addColorStop(0, cfg.bodyGlow);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.fillStyle = glow;
    ctx.arc(bx, by, r * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = cfg.bodyColor;
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStars() {
    stars.forEach(s => {
      const twinkle = 0.6 + 0.4 * Math.sin(performance.now() / 1000 * s.twinkleSpeed + s.phase);
      const a = s.baseAlpha * twinkle * cfg.starAlphaMul;
      ctx.beginPath();
      ctx.fillStyle = `rgba(240,226,201,${a.toFixed(2)})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawNebulas() {
    nebulas.forEach(n => {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      grad.addColorStop(0, `rgba(${n.color},${n.alpha})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawHabitat(a) {
    ctx.save();
    ctx.rotate(a.habitatAngle);
    const hx = a.radius * 0.78;
    const hy = 0;

    ctx.beginPath();
    ctx.ellipse(hx, hy, a.radius * 0.16, a.radius * 0.11, 0, Math.PI, 0);
    ctx.fillStyle = 'rgba(240,226,201,0.5)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(hx, hy - a.radius * 0.11);
    ctx.lineTo(hx, hy - a.radius * 0.22);
    ctx.strokeStyle = 'rgba(240,226,201,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const blink = 0.5 + 0.5 * Math.sin(performance.now() / 400 + a.blinkPhase);
    ctx.beginPath();
    ctx.arc(hx, hy + a.radius * 0.02, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(201,168,118,${blink.toFixed(2)})`;
    ctx.fill();

    ctx.restore();
  }

  function hexToRgb(hex) {
    const v = hex.replace('#', '');
    return {
      r: parseInt(v.substring(0, 2), 16),
      g: parseInt(v.substring(2, 4), 16),
      b: parseInt(v.substring(4, 6), 16)
    };
  }
  function blendToward(hexA, hexB, t) {
    const a = hexToRgb(hexA), b = hexToRgb(hexB);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bl = Math.round(a.b + (b.b - a.b) * t);
    return `rgb(${r},${g},${bl})`;
  }

  const POP_DURATION = 480;

  function drawAsteroid(a) {
    const popT = clamp((performance.now() - a.spawnTime) / POP_DURATION, 0, 1);
    const popEased = 1 - Math.pow(1 - popT, 3);

    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rotation);
    ctx.globalAlpha = popEased;
    ctx.scale(popEased, popEased);

    const hoverBoost = dist(mouse.x, mouse.y, a.x, a.y) <= a.radius + 8 ? 0.18 : 0;
    const flashBoost = a.flash > 0 ? a.flash * 0.5 : 0;
    const totalBoost = clamp(cfg.lightBoost * 0.35 + hoverBoost + flashBoost, 0, 1);

    const grad = ctx.createRadialGradient(-a.radius * 0.3, -a.radius * 0.3, a.radius * 0.1, 0, 0, a.radius);
    grad.addColorStop(0, totalBoost > 0 ? blendToward(a.theme.base, '#F0E2C9', totalBoost) : a.theme.base);
    grad.addColorStop(1, a.theme.shade);

    ctx.beginPath();
    a.shape.points.forEach((pt, i) => {
      const px = Math.cos(pt.angle) * pt.r;
      const py = Math.sin(pt.angle) * pt.r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    a.shape.craters.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fill();
    });

    if (a.inhabited) drawHabitat(a);

    if (hoverBoost > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, a.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(201,168,118,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawUFO() {
    if (!ufo) return;
    const bobY = ufo.y + Math.sin(ufo.wobblePhase) * 6;
    ctx.save();
    ctx.translate(ufo.x, bobY);

    ctx.beginPath();
    ctx.ellipse(0, -6, 12, 9, 0, Math.PI, 0);
    ctx.fillStyle = 'rgba(201,168,118,0.35)';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
    const bodyGrad = ctx.createLinearGradient(-26, 0, 26, 0);
    bodyGrad.addColorStop(0, '#8D95A6');
    bodyGrad.addColorStop(0.5, '#EDEAE2');
    bodyGrad.addColorStop(1, '#8D95A6');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    for (let i = -1; i <= 1; i++) {
      const on = Math.sin(ufo.blink + i) > 0;
      ctx.beginPath();
      ctx.arc(i * 9, 4, 2, 0, Math.PI * 2);
      ctx.fillStyle = on ? '#C9A876' : 'rgba(201,168,118,0.2)';
      ctx.fill();
    }

    ctx.restore();
  }

  function drawParticles() {
    particles.forEach(p => {
      if (p.type === 'comet') {
        const tailX = p.x - p.vx * 4;
        const tailY = p.y - p.vy * 4;
        const grad = ctx.createLinearGradient(p.x, p.y, tailX, tailY);
        grad.addColorStop(0, `rgba(${p.color},${p.life})`);
        grad.addColorStop(1, 'rgba(240,226,201,0)');
        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.color},${p.life.toFixed(2)})`;
      ctx.shadowColor = `rgba(${p.color},${p.life})`;
      ctx.shadowBlur = p.type === 'comet' ? 12 : (p.type === 'trail' ? 8 : 4);
      ctx.arc(p.x, p.y, p.r * (p.type === 'comet' ? 1 : p.life), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawSky();
    drawNebulas();
    drawStars();
    drawCelestialBody();
    asteroids.forEach(drawAsteroid);
    drawUFO();
    drawParticles();
  }

  // ---------- Loop ----------
  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  // ---------- Init ----------
  function init() {
    resize();
    makeStars();
    makeNebulas();
    makeAsteroids();
    canvas.style.cursor = 'default';
    document.addEventListener('click', handleClick);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', resize);
    requestAnimationFrame(loop);
  }

  init();
});
