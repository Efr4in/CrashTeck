// ============================================
// ADMIN — puerta de acceso rápida (en las 4 páginas públicas)
// ============================================
// Cómo funciona:
//  1. Clic en el logo (arriba a la izquierda).
//  2. Si no hay sesión, pide correo y contraseña (tu usuario real de
//     Supabase Auth); si son correctos, te lleva directo al panel de
//     administrador (/admin.html).
//  3. Si ya hay sesión activa, el clic te lleva directo al panel, sin
//     volver a pedir la contraseña.
//  Toda la edición (textos, proyectos, datos de contacto) vive
//  exclusivamente en /admin.html — esta página pública solo aplica los
//  textos ya guardados en la base de datos y ofrece el acceso al panel.

// ---------- Aplicar textos guardados (corre en TODAS las páginas, con o sin sesión) ----------
async function applySavedContent() {
  const content = await sbGetContent();
  document.querySelectorAll('[data-edit-key]').forEach((el) => {
    const key = el.getAttribute('data-edit-key');
    if (content[key] !== undefined) {
      el.textContent = content[key];
    }
  });
  return content;
}

// ---------- Links sociales + estado de disponibilidad (datos que no son texto plano) ----------
function applySpecialContent(content) {
  document.querySelectorAll('[data-social-href-key]').forEach((el) => {
    const key = el.getAttribute('data-social-href-key');
    const url = content[key];
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
    const status = content['estado.disponibilidad'] || 'disponible';
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
      <div class="admin-modal login-modal">
        <div class="login-modal-badge">
          <img src="img/crash-logo.png" alt="CrashTech">
        </div>
        <h3>Acceso de administrador</h3>
        <p class="login-modal-sub">Acceso restringido — solo Efra.</p>

        <input type="email" id="adminUserInput" placeholder="Correo" autocomplete="username">
        <div class="admin-password-field">
          <input type="password" id="adminPasswordInput" placeholder="Contraseña" autocomplete="current-password">
          <button type="button" id="adminTogglePw" aria-label="Mostrar contraseña">
            <svg id="pwIconOpen" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg id="pwIconClosed" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" style="display:none;"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.7 19.7 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a19.86 19.86 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </button>
        </div>

        <label class="remember-check">
          <input type="checkbox" id="rememberEmailCheck">
          <span class="remember-box"></span>
          Recordar mi correo
        </label>

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

const REMEMBER_EMAIL_KEY = 'crashRememberedEmail';

function initAdmin() {
  buildLoginModal();

  const loginOverlay = document.getElementById('loginOverlay');
  const emailInput = document.getElementById('adminUserInput');
  const passwordInput = document.getElementById('adminPasswordInput');
  const rememberCheck = document.getElementById('rememberEmailCheck');
  const loginError = document.getElementById('loginError');
  const logo = document.querySelector('header .brand-badge');

  function openLogin() {
    loginError.textContent = '';
    passwordInput.value = '';
    const remembered = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (remembered) {
      emailInput.value = remembered;
      rememberCheck.checked = true;
    } else {
      emailInput.value = '';
      rememberCheck.checked = false;
    }
    loginOverlay.classList.add('show');
    setTimeout(() => (remembered ? passwordInput : emailInput).focus(), 50);
  }
  function closeLogin() {
    loginOverlay.classList.remove('show');
  }

  // Logo: sin sesión -> pide credenciales; con sesión -> directo al panel
  if (logo) {
    logo.addEventListener('click', async () => {
      const session = await sbGetSession();
      if (session) {
        window.location.href = 'admin.html';
      } else {
        openLogin();
      }
    });
  }

  document.getElementById('adminTogglePw').addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    document.getElementById('pwIconOpen').style.display = isPassword ? 'none' : 'block';
    document.getElementById('pwIconClosed').style.display = isPassword ? 'block' : 'none';
  });

  document.getElementById('loginCancel').addEventListener('click', closeLogin);

  async function attemptLogin() {
    const submitBtn = document.getElementById('loginSubmit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ingresando...';
    loginError.textContent = '';
    const { ok } = await sbSignIn(emailInput.value.trim(), passwordInput.value);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Ingresar';
    if (ok) {
      if (rememberCheck.checked) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, emailInput.value.trim());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
      window.location.href = 'admin.html';
    } else {
      loginError.textContent = 'Correo o contraseña incorrectos.';
    }
  }

  document.getElementById('loginSubmit').addEventListener('click', attemptLogin);
  [emailInput, passwordInput].forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') attemptLogin();
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const content = await applySavedContent();
  applySpecialContent(content);
  initAdmin();
});
