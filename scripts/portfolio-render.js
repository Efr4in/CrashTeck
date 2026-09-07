// ============================================
// Renderiza las tarjetas de Portafolio a partir de los proyectos
// guardados en la base de datos (tabla "projects" en Supabase).
// Mientras no haya proyectos guardados, se muestra un estado vacío.
// ============================================

function renderProjectMedia(p) {
  if ((p.media_type === 'image' || p.media_type === 'gif') && p.media_url) {
    return `<img src="${p.media_url}" alt="${escapeHtml(p.title)}" draggable="false">`;
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

async function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  grid.innerHTML = `<div class="portfolio-empty">Cargando proyectos...</div>`;
  const projects = await sbGetProjects();

  if (projects.length === 0) {
    grid.innerHTML = `
      <div class="portfolio-empty reveal">
        Todavía no hay proyectos publicados aquí.<br>
        Vuelve pronto — se están preparando.
      </div>`;
    return;
  }

  grid.innerHTML = projects.map((p) => `
    <div class="card reveal">
      <div class="card-window">${renderProjectMedia(p)}</div>
      <h3>${escapeHtml(p.title)}</h3>
      <div class="card-desc">${escapeHtml(p.description)}</div>
      <div class="tag-row">
        ${(p.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
      </div>
    </div>
  `).join('');

  const revealEls = grid.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('in');
    });
  }, { threshold: 0.15 });
  revealEls.forEach((el) => io.observe(el));
}

document.addEventListener('DOMContentLoaded', renderProjects);
