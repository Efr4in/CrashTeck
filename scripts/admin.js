// ============================================
// ADMIN — puerta de acceso rápida (en las 4 páginas públicas)
// ============================================
// Cómo funciona (v1, sin backend todavía):
//  1. Clic en el logo (arriba a la izquierda).
//  2. Si no hay sesión, pide usuario y contraseña; si son correctos,
//     te lleva directo al panel de administrador (/admin.html).
//  3. Si ya hay sesión activa, el clic te lleva directo al panel,
//     sin volver a pedir la contraseña.
//  Toda la edición (textos, proyectos, datos de contacto) vive
//  exclusivamente en /admin.html — esta página pública solo aplica
//  los cambios ya guardados y ofrece el acceso rápido al panel.
//
// IMPORTANTE: esto es un prototipo. Las credenciales viven en este
// archivo (texto plano) y localStorage es SOLO de este navegador/equipo
// — no es un panel real ni sincroniza entre visitantes. Cuando pasemos
// a un backend (Supabase), esto se reemplaza por autenticación real.
//
// ⚠️ Si abres los archivos con doble clic (file://), algunos navegadores
// (sobre todo Chrome) NO comparten localStorage entre archivos HTML
// distintos por seguridad. Usa un servidor local (ej. "Live Server" de
// VS Code) para que los cambios guardados se vean en todas las páginas.

const CRASH_ADMIN_USERNAME = 'admin'; // debe coincidir con scripts/admin-dashboard.js
const CRASH_ADMIN_PASSWORD = '1234';  // debe coincidir con scripts/admin-dashboard.js

const CONTENT_STORAGE_KEY = 'crashtechContent';
const SESSION_FLAG = 'crashAdminLoggedIn';

// ---------- Aplicar textos guardados (corre en TODAS las páginas, con o sin sesión) ----------
function applySavedContent() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(CONTENT_STORAGE_KEY) || '{}');
  } catch (e) {
    saved = {};
  }
  document.querySelectorAll('[data-edit-key]').forEach(el => {
    const key = el.getAttribute('data-edit-key');
    if (saved[key] !== undefined) {
      el.textContent = saved[key];
    }
  });
  return saved;
}

// ---------- Links sociales + estado de disponibilidad (datos que no son texto plano) ----------
function applySpecialContent(saved) {
  document.querySelectorAll('[data-social-href-key]').forEach(el => {
    const key = el.getAttribute('data-social-href-key');
    const url = saved[key];
    if (url) {
      el.href = url;
      el.classList.remove('is-empty');
    } else {
      el.href = '#';
      el.classList.add('is-empty');
    }
  });

  const badge = document.getElementById('availabilityBadge');
  if (badge) {
    const textEl = document.getElementById('availabilityText');
    const status = saved['estado.disponibilidad'] || 'disponible';
    if (status === 'ocupado') {
      badge.classList.add('is-busy');
      if (textEl) textEl.textContent = 'No disponible por ahora';
    } else {
      badge.classList.remove('is-busy');
      if (textEl) textEl.textContent = 'Disponible para nuevos proyectos';
    }
  }
}

// ---------- Modal de login rápido ----------
function buildLoginModal() {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="admin-modal-overlay" id="loginOverlay">
      <div class="admin-modal">
        <div class="admin-modal-header">
          <div class="brand-badge"><img src="img/crash-logo.png" alt="CrashTech"></div>
          <div>
            <h3>Acceso de administrador</h3>
            <p>Acceso restringido — solo Efra.</p>
          </div>
        </div>
        <input type="text" id="adminUserInput" placeholder="Usuario" autocomplete="username">
        <div class="admin-password-field">
          <input type="password" id="adminPasswordInput" placeholder="Contraseña" autocomplete="current-password">
          <button type="button" id="adminTogglePw" aria-label="Mostrar contraseña">👁</button>
        </div>
        <div class="admin-error" id="loginError"></div>
        <div class="row">
          <button type="button" class="btn btn-ghost" id="loginCancel">Cancelar</button>
          <button type="button" class="btn btn-primary" id="loginSubmit">Ingresar</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
}

function initAdmin() {
  buildLoginModal();

  const loginOverlay = document.getElementById('loginOverlay');
  const userInput = document.getElementById('adminUserInput');
  const passwordInput = document.getElementById('adminPasswordInput');
  const loginError = document.getElementById('loginError');
  const logo = document.querySelector('header .brand-badge');

  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_FLAG) === '1';
  }

  function openLogin() {
    loginError.textContent = '';
    userInput.value = '';
    passwordInput.value = '';
    loginOverlay.classList.add('show');
    setTimeout(() => userInput.focus(), 50);
  }
  function closeLogin() {
    loginOverlay.classList.remove('show');
  }

  // Logo: sin sesión -> pide credenciales; con sesión -> directo al panel
  if (logo) {
    logo.addEventListener('click', () => {
      if (isLoggedIn()) {
        window.location.href = 'admin.html';
      } else {
        openLogin();
      }
    });
  }

  document.getElementById('adminTogglePw').addEventListener('click', () => {
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('loginCancel').addEventListener('click', closeLogin);
  document.getElementById('loginSubmit').addEventListener('click', () => {
    if (userInput.value === CRASH_ADMIN_USERNAME && passwordInput.value === CRASH_ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_FLAG, '1');
      window.location.href = 'admin.html';
    } else {
      loginError.textContent = 'Usuario o contraseña incorrectos.';
    }
  });
  [userInput, passwordInput].forEach(el => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('loginSubmit').click();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = applySavedContent();
  applySpecialContent(saved);
  initAdmin();
});
