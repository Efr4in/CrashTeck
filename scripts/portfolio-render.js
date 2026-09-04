// ============================================
// Renderiza las tarjetas de Portafolio a partir de lo que el
// administrador haya guardado desde el dashboard (/admin.html).
// Mientras no haya proyectos guardados, se muestra un estado vacío.
// ============================================

const PROJECTS_STORAGE_KEY = 'crashtechProjects';

function loadProjects() {
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function renderProjectMedia(p) {
  if (p.mediaType === 'image' || p.mediaType === 'gif') {
    if (p.mediaData) return `<img src="${p.mediaData}" alt="${escapeHtml(p.title)}" draggable="false">`;
  }
  if (p.mediaType === 'video' && p.mediaData) {
    return `<video src="${p.mediaData}" muted loop autoplay playsinline controlsList="nodownload" disablepictureinpicture></video>`;
  }
  return `<span>Vista previa</span>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  const projects = loadProjects();

  if (projects.length === 0) {
    grid.innerHTML = `
      <div class="portfolio-empty reveal">
        Todavía no hay proyectos publicados aquí.<br>
        Vuelve pronto — se están preparando.
      </div>`;
    return;
  }

  grid.innerHTML = projects.map(p => `
    <div class="card reveal">
      <div class="card-window">${renderProjectMedia(p)}</div>
      <h3>${escapeHtml(p.title)}</h3>
      <div class="card-desc">${escapeHtml(p.description)}</div>
      <div class="tag-row">
        ${(p.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
      </div>
    </div>
  `).join('');

  // Reactiva el efecto de aparición al hacer scroll para las tarjetas nuevas
  const revealEls = grid.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in');
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));
}

document.addEventListener('DOMContentLoaded', renderProjects);
