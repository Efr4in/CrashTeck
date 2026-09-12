// ============================================
// Renderiza las tarjetas de Portafolio a partir de los proyectos
// guardados en la base de datos (tabla "projects" en Supabase), y el
// modal de detalle expandido ("case study") que se abre al hacer clic
// en cualquiera de ellas.
// ============================================

let projectsData = [];

function renderProjectMedia(p) {
  if (p.media_type === 'carousel' && p.media_urls && p.media_urls.length > 0) {
    const slides = p.media_urls.map((url, i) =>
      `<img src="${url}" alt="${escapeHtml(p.title)}" draggable="false" loading="lazy" class="carousel-slide${i === 0 ? ' active' : ''}">`
    ).join('');
    const dots = p.media_urls.length > 1
      ? `<div class="carousel-dots">${p.media_urls.map((_, i) => `<span class="carousel-dot${i === 0 ? ' active' : ''}"></span>`).join('')}</div>`
      : '';
    return `<div class="carousel-window">${slides}${dots}</div>`;
  }
  if ((p.media_type === 'image' || p.media_type === 'gif') && p.media_url) {
    return `<img src="${p.media_url}" alt="${escapeHtml(p.title)}" draggable="false" loading="lazy">`;
  }
  if (p.media_type === 'video' && p.media_url) {
    const embed = sbDriveEmbedUrl(p.media_url);
    if (embed) {
      return `<iframe src="${embed}" allow="autoplay" style="border:0;width:100%;height:100%;"></iframe>`;
    }
    return `<video src="${p.media_url}" muted loop autoplay playsinline controlsList="nodownload" disablepictureinpicture></video>`;
  }
  return `<span>Vista previa</span>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Cada carrusel rota solo — cada 10s, y en loop (con 2 imágenes vuelve a
// alternar entre ambas; con 1 sola queda estático porque no hay nada que
// rotar).
function initCarousel(container) {
  const slides = container.querySelectorAll('.carousel-slide');
  const dots = container.querySelectorAll('.carousel-dot');
  if (slides.length <= 1) return;

  let index = 0;
  setInterval(() => {
    slides[index].classList.remove('active');
    if (dots[index]) dots[index].classList.remove('active');
    index = (index + 1) % slides.length;
    slides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');
  }, 10000);
}

// ---------- Modal de detalle expandido ----------
function buildProjectModal() {
  if (document.getElementById('projectModalOverlay')) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="project-modal-overlay" id="projectModalOverlay">
      <div class="project-modal">
        <button type="button" class="project-modal-close" id="projectModalClose" aria-label="Cerrar">✕</button>
        <div class="project-modal-gallery" id="projectModalGallery"></div>
        <div class="project-modal-body">
          <h2 id="projectModalTitle"></h2>
          <p class="project-modal-role" id="projectModalRole"></p>
          <div class="tag-row" id="projectModalTags"></div>
          <p class="project-modal-desc" id="projectModalDesc"></p>
          <div class="project-modal-actions" id="projectModalActions"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  document.getElementById('projectModalClose').addEventListener('click', closeProjectModal);
  document.getElementById('projectModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'projectModalOverlay') closeProjectModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProjectModal();
  });
}

function galleryHtml(p) {
  const urls = p.media_type === 'carousel' ? (p.media_urls || []) : (p.media_url ? [p.media_url] : []);

  if (p.media_type === 'video' && p.media_url) {
    const embed = sbDriveEmbedUrl(p.media_url);
    return embed
      ? `<iframe src="${embed}" allow="autoplay" style="border:0;width:100%;aspect-ratio:16/9;"></iframe>`
      : `<video src="${p.media_url}" controls style="width:100%;border-radius:10px;"></video>`;
  }

  if (urls.length === 0) return '';

  return `<div class="project-modal-grid">
    ${urls.map((url) => `<img src="${url}" alt="${escapeHtml(p.title)}" draggable="false" loading="lazy">`).join('')}
  </div>`;
}

function openProjectModal(id) {
  const p = projectsData.find((x) => x.id === id);
  if (!p) return;

  document.getElementById('projectModalGallery').innerHTML = galleryHtml(p);
  document.getElementById('projectModalTitle').textContent = p.title;
  document.getElementById('projectModalDesc').textContent = p.description;

  const roleEl = document.getElementById('projectModalRole');
  if (p.role) {
    roleEl.textContent = p.role;
    roleEl.style.display = 'block';
  } else {
    roleEl.style.display = 'none';
  }

  document.getElementById('projectModalTags').innerHTML =
    (p.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');

  const actions = document.getElementById('projectModalActions');
  actions.innerHTML = p.github_url
    ? `<a href="${p.github_url}" target="_blank" rel="noopener" class="btn btn-ghost">Ver en GitHub</a>`
    : '';

  document.getElementById('projectModalOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  const overlay = document.getElementById('projectModalOverlay');
  if (overlay) overlay.classList.remove('show');
  document.body.style.overflow = '';
}

async function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  grid.innerHTML = `<div class="portfolio-empty">Cargando proyectos...</div>`;
  projectsData = await sbGetProjects();

  if (projectsData.length === 0) {
    grid.innerHTML = `
      <div class="portfolio-empty reveal">
        Todavía no hay proyectos publicados aquí.<br>
        Vuelve pronto — se están preparando.
      </div>`;
    return;
  }

  buildProjectModal();

  grid.innerHTML = projectsData.map((p) => `
    <div class="card reveal" data-project-id="${p.id}" tabindex="0" role="button" aria-label="Ver detalle de ${escapeHtml(p.title)}">
      <div class="card-window">${renderProjectMedia(p)}</div>
      <h3>${escapeHtml(p.title)}</h3>
      <div class="card-desc">${escapeHtml(p.description)}</div>
      <div class="tag-row">
        ${(p.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.carousel-window').forEach(initCarousel);

  grid.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => openProjectModal(card.dataset.projectId));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProjectModal(card.dataset.projectId);
      }
    });
  });

  const revealEls = grid.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('in');
    });
  }, { threshold: 0.15 });
  revealEls.forEach((el) => io.observe(el));
}

document.addEventListener('DOMContentLoaded', renderProjects);
