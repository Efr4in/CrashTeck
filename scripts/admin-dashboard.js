// ============================================
// DASHBOARD DE ADMINISTRADOR (/admin.html)
// ============================================
// El login ya no vive aquí — solo se entra a través del modal del sitio
// público (scripts/admin.js), que es quien valida usuario/contraseña y
// redirige aquí tras autenticar. Esta página solo verifica que exista
// una sesión válida (ver initSecurityGuard más abajo) y, si no la hay,
// trata la visita como un intruso y la manda a 404.html.

const CONTENT_STORAGE_KEY = 'crashtechContent';
const PROJECTS_STORAGE_KEY = 'crashtechProjects';
const SESSION_FLAG = 'crashAdminLoggedIn';

// ---------- Config de todos los textos editables del sitio, por página ----------
const TEXT_FIELDS = {
  inicio: [
    { key: 'hero.title', label: 'Título del hero', default: 'CrashTech' },
    { key: 'hero.slogan', label: 'Eslogan', default: 'Diseño creativo. Código funcional. Responsabilidad.' },
    { key: 'estado.disponibilidad', label: 'Estado de disponibilidad', type: 'select', default: 'disponible',
      options: [
        { value: 'disponible', label: 'Disponible para nuevos proyectos' },
        { value: 'ocupado', label: 'No disponible por ahora' }
      ] },
    { key: 'footer.github', label: 'Link de GitHub (aparece en las 4 páginas)', default: '' },
    { key: 'footer.linkedin', label: 'Link de LinkedIn (aparece en las 4 páginas)', default: '' },
    { key: 'footer.copy', label: 'Pie de página — copyright (aparece en las 4 páginas)', default: '© 2026 CrashTech' },
    { key: 'footer.ubicacion', label: 'Pie de página — ubicación (aparece en las 4 páginas)', default: 'Hecho en La Paz, Bolivia' }
  ],
  portafolio: [
    { key: 'portafolio.eyebrow', label: 'Etiqueta superior', default: 'Portafolio' },
    { key: 'portafolio.titulo', label: 'Título', default: 'Proyectos seleccionados' },
    { key: 'portafolio.descripcion', label: 'Descripción', multiline: true, default: 'Algunos de los sistemas que diseñé y desarrollé de principio a fin, cada uno resolviendo una necesidad concreta de un cliente real.' }
  ],
  contacto: [
    { key: 'contacto.eyebrow', label: 'Etiqueta superior', default: 'Contacto' },
    { key: 'contacto.titulo', label: 'Título', default: '¿Tienes un proyecto en mente?' },
    { key: 'contacto.descripcion', label: 'Descripción', multiline: true, default: 'Cuéntame qué necesitas y te respondo directamente — sin formularios eternos ni intermediarios.' },
    { key: 'contacto.whatsapp.descripcion', label: 'Texto de la tarjeta WhatsApp', default: 'Te abrimos WhatsApp con tu mensaje listo para enviar.' },
    { key: 'contacto.correo.descripcion', label: 'Texto de la tarjeta Correo', default: 'Se abrirá tu cliente de correo con todo ya escrito.' }
  ],
  privacidad: [
    { key: 'privacidad.eyebrow', label: 'Etiqueta superior', default: 'Privacidad & Términos' },
    { key: 'privacidad.titulo', label: 'Título', default: 'Cómo trabajo' },
    { key: 'privacidad.item1.titulo', label: 'Punto 1 — título', default: 'Todo por contrato' },
    { key: 'privacidad.item1.descripcion', label: 'Punto 1 — descripción', multiline: true, default: 'Cada proyecto se formaliza con un contrato claro antes de empezar: alcance, tiempos y entregables definidos desde el inicio.' },
    { key: 'privacidad.item2.titulo', label: 'Punto 2 — título', default: 'Ajustes menores, sin costo' },
    { key: 'privacidad.item2.descripcion', label: 'Punto 2 — descripción', multiline: true, default: 'Pequeños ajustes o correcciones sobre lo entregado están incluidos, sin cargos adicionales ni letra chica.' },
    { key: 'privacidad.item3.titulo', label: 'Punto 3 — título', default: 'Cambios mayores, aparte' },
    { key: 'privacidad.item3.descripcion', label: 'Punto 3 — descripción', multiline: true, default: 'Si se pide algo fuera del alcance original —nuevas funciones o un cambio de fondo— se cotiza como trabajo adicional, de forma transparente.' }
  ]
};

// Datos reales de contacto (número de WhatsApp y correo), independientes de los textos
const CONTACT_INFO_KEYS = { numero: 'contacto.info.numero', email: 'contacto.info.email' };

function getSavedContent() {
  try { return JSON.parse(localStorage.getItem(CONTENT_STORAGE_KEY) || '{}'); }
  catch (e) { return {}; }
}
function getSavedProjects() {
  try { return JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) || '[]'); }
  catch (e) { return []; }
}
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;');
}

// ================= LOGIN =================
function initSecurityGuard() {
  // El head ya redirige a 404.html si no hay sesión válida — esto es un respaldo
  // por si ese script no llegó a correr por alguna razón.
  if (sessionStorage.getItem(SESSION_FLAG) !== '1') {
    window.location.replace('404.html');
    return;
  }
  initDashboard();
}

// ================= DASHBOARD =================
function initDashboard() {
  initTabs();
  Object.keys(TEXT_FIELDS).forEach(renderTextFieldsFor);
  initSaveButtons();
  initContactInfo();
  initProjectsPanel();
  renderOverview();

  document.getElementById('dashLogout').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_FLAG);
    window.location.href = 'index.html';
  });
}

function initTabs() {
  const buttons = document.querySelectorAll('.admin-tabs button');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.admin-panel-view').forEach(v => {
        v.classList.toggle('active', v.id === 'view-' + btn.dataset.tab);
      });
    });
  });
}

// ---------- Campos de texto, por página ----------
function renderTextFieldsFor(pageKey) {
  const container = document.getElementById('fields-' + pageKey);
  if (!container) return;
  const saved = getSavedContent();
  const fields = TEXT_FIELDS[pageKey];

  container.innerHTML = `
    <div class="admin-field-group">
      ${fields.map(f => {
        const current = saved[f.key] !== undefined ? saved[f.key] : f.default;
        let control;
        if (f.type === 'select') {
          control = `<select id="field-${f.key}" data-key="${f.key}">
            ${f.options.map(opt => `<option value="${escapeAttr(opt.value)}" ${opt.value === current ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`).join('')}
          </select>`;
        } else if (f.multiline) {
          control = `<textarea id="field-${f.key}" rows="3" data-key="${f.key}">${escapeHtml(current)}</textarea>`;
        } else {
          control = `<input type="text" id="field-${f.key}" data-key="${f.key}" value="${escapeAttr(current)}">`;
        }
        return `
        <div class="admin-field">
          <label for="field-${f.key}">${f.label}</label>
          ${control}
        </div>
      `;
      }).join('')}
    </div>
  `;
}

function initSaveButtons() {
  document.querySelectorAll('.admin-panel-view').forEach(view => {
    const pageKey = view.id.replace('view-', '');
    const saveBtn = view.querySelector('.save-texts-btn');
    const resetBtn = view.querySelector('.reset-texts-btn');
    const msg = view.querySelector('.admin-save-msg');

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const current = getSavedContent();
        view.querySelectorAll('[data-key]').forEach(el => {
          current[el.dataset.key] = el.value;
        });
        localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(current));
        msg.classList.add('show');
        renderOverview();
        setTimeout(() => msg.classList.remove('show'), 1800);
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (!confirm('¿Restablecer los textos de esta página a su versión original?')) return;
        const current = getSavedContent();
        (TEXT_FIELDS[pageKey] || []).forEach(f => delete current[f.key]);
        localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(current));
        renderTextFieldsFor(pageKey);
      });
    }
  });
}

// ---------- Datos reales de contacto ----------
function initContactInfo() {
  const saved = getSavedContent();
  document.getElementById('field-contacto-numero').value = saved[CONTACT_INFO_KEYS.numero] || '';
  document.getElementById('field-contacto-email').value = saved[CONTACT_INFO_KEYS.email] || '';

  // Se guardan junto con el resto de los textos de Contacto (mismo botón "Guardar cambios")
  document.getElementById('field-contacto-numero').dataset.key = CONTACT_INFO_KEYS.numero;
  document.getElementById('field-contacto-email').dataset.key = CONTACT_INFO_KEYS.email;

  document.getElementById('testWhatsapp').addEventListener('click', () => {
    const numero = document.getElementById('field-contacto-numero').value.trim();
    if (!numero) { alert('Primero escribe un número.'); return; }
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent('Mensaje de prueba desde el panel')}`, '_blank');
  });
  document.getElementById('testEmail').addEventListener('click', () => {
    const email = document.getElementById('field-contacto-email').value.trim();
    if (!email) { alert('Primero escribe un correo.'); return; }
    window.location.href = `mailto:${email}?subject=${encodeURIComponent('Prueba desde el panel')}`;
  });
}

// ---------- Panel de portafolio ----------
let editingProjectId = null;
let currentTags = [];
let pendingMediaData = null;

function initProjectsPanel() {
  renderProjectList();

  document.getElementById('addProjectBtn').addEventListener('click', () => openEditor(null));
  document.getElementById('cancelProjectBtn').addEventListener('click', closeEditor);
  document.getElementById('saveProjectBtn').addEventListener('click', saveProject);

  document.getElementById('projMediaType').addEventListener('change', updateMediaFieldVisibility);
  document.getElementById('projMediaFile').addEventListener('change', handleFileSelect);
  document.getElementById('projMediaUrl').addEventListener('input', updateMediaPreviewFromUrl);

  const tagInput = document.getElementById('projTagInput');
  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && tagInput.value.trim()) {
      e.preventDefault();
      addTag(tagInput.value.trim());
      tagInput.value = '';
    }
  });
}

function renderProjectList() {
  const list = document.getElementById('projectList');
  const projects = getSavedProjects();

  if (projects.length === 0) {
    list.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;">Aún no agregaste ningún proyecto.</p>`;
    return;
  }

  list.innerHTML = projects.map(p => `
    <div class="admin-project-item">
      <div class="thumb">${thumbHtml(p)}</div>
      <div class="info">
        <strong>${escapeHtml(p.title)}</strong>
        <span>${(p.tags || []).join(', ') || 'sin etiquetas'}</span>
      </div>
      <div class="actions">
        <button type="button" data-edit="${p.id}">Editar</button>
        <button type="button" class="danger" data-delete="${p.id}">Eliminar</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openEditor(btn.dataset.edit));
  });
  list.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteProject(btn.dataset.delete));
  });
}

function thumbHtml(p) {
  if ((p.mediaType === 'image' || p.mediaType === 'gif') && p.mediaData) {
    return `<img src="${p.mediaData}" alt="">`;
  }
  if (p.mediaType === 'video' && p.mediaData) {
    return `<video src="${p.mediaData}" muted></video>`;
  }
  return 'Sin imagen';
}

function deleteProject(id) {
  if (!confirm('¿Eliminar este proyecto del portafolio?')) return;
  const projects = getSavedProjects().filter(p => p.id !== id);
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  renderProjectList();
  renderOverview();
}

function openEditor(id) {
  editingProjectId = id;
  const editor = document.getElementById('projectEditor');
  const title = document.getElementById('editorTitle');

  if (id) {
    const p = getSavedProjects().find(x => x.id === id);
    title.textContent = 'Editar proyecto';
    document.getElementById('projTitle').value = p.title || '';
    document.getElementById('projDesc').value = p.description || '';
    currentTags = [...(p.tags || [])];
    document.getElementById('projMediaType').value = p.mediaType || 'none';
    document.getElementById('projMediaUrl').value = p.mediaType === 'video' ? (p.mediaData || '') : '';
    pendingMediaData = (p.mediaType === 'image' || p.mediaType === 'gif') ? (p.mediaData || null) : null;
  } else {
    title.textContent = 'Nuevo proyecto';
    document.getElementById('projTitle').value = '';
    document.getElementById('projDesc').value = '';
    currentTags = [];
    document.getElementById('projMediaType').value = 'none';
    document.getElementById('projMediaUrl').value = '';
    pendingMediaData = null;
  }

  document.getElementById('projMediaFile').value = '';
  document.getElementById('projMediaFileName').textContent = 'Sin archivo seleccionado';
  renderTags();
  updateMediaFieldVisibility();
  updateMediaPreview();
  editor.classList.add('show');
  editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeEditor() {
  document.getElementById('projectEditor').classList.remove('show');
  editingProjectId = null;
}

function renderTags() {
  const wrap = document.getElementById('tagInputWrap');
  const input = document.getElementById('projTagInput');
  wrap.querySelectorAll('.admin-tag-chip').forEach(el => el.remove());
  currentTags.forEach((tag, i) => {
    const chip = document.createElement('span');
    chip.className = 'admin-tag-chip';
    chip.innerHTML = `${escapeHtml(tag)} <button type="button" data-i="${i}">✕</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      currentTags.splice(i, 1);
      renderTags();
    });
    wrap.insertBefore(chip, input);
  });
}
function addTag(tag) {
  if (currentTags.includes(tag)) return;
  currentTags.push(tag);
  renderTags();
}

function updateMediaFieldVisibility() {
  const type = document.getElementById('projMediaType').value;
  document.getElementById('mediaFileField').style.display = (type === 'image' || type === 'gif') ? 'block' : 'none';
  document.getElementById('mediaUrlField').style.display = (type === 'video') ? 'block' : 'none';
  updateMediaPreview();
}

function handleFileSelect(evt) {
  const file = evt.target.files[0];
  if (!file) return;

  document.getElementById('projMediaFileName').textContent = file.name;

  const warningEl = document.querySelector('#mediaFileField .admin-media-warning');
  if (file.size > 800 * 1024) {
    warningEl.textContent = `Este archivo pesa ${(file.size / 1024).toFixed(0)} KB — puede hacer que el guardado local falle o vaya lento. Considera comprimirlo.`;
  } else {
    warningEl.textContent = 'Recomendado: menos de 800 KB — se guarda en este navegador.';
  }

  const reader = new FileReader();
  reader.onload = () => {
    pendingMediaData = reader.result;
    updateMediaPreview();
  };
  reader.readAsDataURL(file);
}

function updateMediaPreviewFromUrl() {
  pendingMediaData = document.getElementById('projMediaUrl').value.trim();
  updateMediaPreview();
}

function updateMediaPreview() {
  const type = document.getElementById('projMediaType').value;
  const preview = document.getElementById('mediaPreview');

  if (type === 'none' || !pendingMediaData) {
    preview.innerHTML = 'Sin vista previa';
    return;
  }
  if (type === 'image' || type === 'gif') {
    preview.innerHTML = `<img src="${pendingMediaData}" alt="">`;
  } else if (type === 'video') {
    preview.innerHTML = `<video src="${pendingMediaData}" muted controls></video>`;
  }
}

function saveProject() {
  const title = document.getElementById('projTitle').value.trim();
  if (!title) {
    alert('Ponle un título al proyecto antes de guardar.');
    return;
  }

  const mediaType = document.getElementById('projMediaType').value;
  const mediaData = mediaType === 'video'
    ? document.getElementById('projMediaUrl').value.trim()
    : pendingMediaData;

  const projects = getSavedProjects();

  const projectData = {
    id: editingProjectId || ('proj_' + Date.now()),
    title,
    description: document.getElementById('projDesc').value.trim(),
    tags: [...currentTags],
    mediaType,
    mediaData: mediaType === 'none' ? null : mediaData
  };

  if (editingProjectId) {
    const idx = projects.findIndex(p => p.id === editingProjectId);
    if (idx !== -1) projects[idx] = projectData;
  } else {
    projects.push(projectData);
  }

  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  renderProjectList();
  renderOverview();
  closeEditor();
}

// ---------- Resumen (dashboard) ----------
function renderOverview() {
  const projects = getSavedProjects();
  const content = getSavedContent();

  // Tarjetas
  document.getElementById('statProjects').textContent = projects.length;

  const allTags = projects.flatMap(p => p.tags || []);
  const uniqueTags = [...new Set(allTags)];
  document.getElementById('statTags').textContent = uniqueTags.length;

  const hasContact = !!(content[CONTACT_INFO_KEYS.numero] && content[CONTACT_INFO_KEYS.email]);
  document.getElementById('statContact').textContent = hasContact ? 'Sí' : 'No';

  const allFields = Object.values(TEXT_FIELDS).flat();
  const customizedCount = allFields.filter(f => content[f.key] !== undefined).length;
  document.getElementById('statTexts').textContent = `${customizedCount} / ${allFields.length}`;

  // Anillo de completitud (proyectos + contacto + textos, ponderado)
  const projectScore = Math.min(projects.length, 3) / 3 * 30;
  const contactScore = hasContact ? 30 : 0;
  const textScore = allFields.length ? (customizedCount / allFields.length) * 40 : 0;
  const completion = Math.round(projectScore + contactScore + textScore);
  drawCompletionRing(completion);
  document.getElementById('ringCaption').textContent = `${completion}% listo`;

  // Etiquetas más usadas
  renderTagBars(allTags);

  // Últimos proyectos agregados
  renderRecentProjects(projects);

  // Estado por página
  renderPageStatus(content);
}

function drawCompletionRing(percent) {
  const canvas = document.getElementById('completionRing');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 80, cy = 80, r = 66;
  ctx.clearRect(0, 0, 160, 160);

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 14;
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = '#C9A876';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  const end = -Math.PI / 2 + (percent / 100) * Math.PI * 2;
  ctx.arc(cx, cy, r, -Math.PI / 2, end);
  ctx.stroke();

  ctx.fillStyle = '#F0E2C9';
  ctx.font = "600 28px 'Fraunces', serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${percent}%`, cx, cy);
}

function renderTagBars(allTags) {
  const wrap = document.getElementById('tagBars');
  if (allTags.length === 0) {
    wrap.innerHTML = `<p class="tag-bars-empty">Aún no hay etiquetas — se llenará cuando agregues proyectos.</p>`;
    return;
  }
  const counts = {};
  allTags.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = sorted[0][1];

  wrap.innerHTML = sorted.map(([tag, count]) => `
    <div class="tag-bar-row">
      <span class="tag-bar-label" title="${escapeHtml(tag)}">${escapeHtml(tag)}</span>
      <div class="tag-bar-track"><div class="tag-bar-fill" style="width:${(count / max) * 100}%;"></div></div>
      <span class="tag-bar-count">${count}</span>
    </div>
  `).join('');
}

function renderRecentProjects(projects) {
  const list = document.getElementById('recentProjectsList');
  if (!list) return;
  if (projects.length === 0) {
    list.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;">Todavía no agregaste proyectos.</p>`;
    return;
  }
  const recent = [...projects].reverse().slice(0, 4);
  list.innerHTML = recent.map(p => `
    <div class="admin-project-item">
      <div class="thumb">${thumbHtml(p)}</div>
      <div class="info">
        <strong>${escapeHtml(p.title)}</strong>
        <span>${(p.tags || []).join(', ') || 'sin etiquetas'}</span>
      </div>
    </div>
  `).join('');
}

function renderPageStatus(content) {
  const wrap = document.getElementById('pageStatusList');
  if (!wrap) return;
  const icons = { inicio: '🏠', portafolio: '🗂', contacto: '✉️', privacidad: '🛡' };
  const labels = { inicio: 'Inicio', portafolio: 'Portafolio', contacto: 'Contacto', privacidad: 'Privacidad' };

  wrap.innerHTML = Object.keys(TEXT_FIELDS).map(pageKey => {
    const fields = TEXT_FIELDS[pageKey];
    const done = fields.filter(f => content[f.key] !== undefined).length;
    const pct = fields.length ? (done / fields.length) * 100 : 0;
    return `
      <div class="page-status-row">
        <span class="psr-icon">${icons[pageKey]}</span>
        <span class="psr-label">${labels[pageKey]}</span>
        <div class="tag-bar-track"><div class="tag-bar-fill" style="width:${pct}%;"></div></div>
        <span class="psr-frac">${done}/${fields.length}</span>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', initSecurityGuard);
