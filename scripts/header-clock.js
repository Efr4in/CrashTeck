// ============================================
// Reloj digital junto al escudo del header — solo en Inicio.
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const timeEl = document.getElementById('headerClockTime');
  const dateEl = document.getElementById('headerClockDate');
  if (!timeEl || !dateEl) return;

  function draw() {
    const now = new Date();
    let hh = now.getHours();
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    if (hh === 0) hh = 12;
    const mm = String(now.getMinutes()).padStart(2, '0');

    timeEl.innerHTML = `${hh}<span class="blink">:</span>${mm}<span class="header-clock-ampm">${ampm}</span>`;
    dateEl.textContent = now.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
  }

  draw();
  setInterval(draw, 1000);
});
