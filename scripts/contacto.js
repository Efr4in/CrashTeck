document.addEventListener('DOMContentLoaded', () => {
  const toggleBtns = document.querySelectorAll('.method-toggle button');
  const panels = document.querySelectorAll('.method-panel');

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;

      toggleBtns.forEach(b => b.classList.toggle('active', b === btn));
      panels.forEach(p => p.classList.toggle('active', p.id === target));
    });
  });

  // WhatsApp: arma el link con el mensaje escrito
  const waForm = document.getElementById('whatsappForm');
  if (waForm) {
    waForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = document.getElementById('waMessage').value.trim();
      const numero = getContactInfo('contacto.info.numero', '000000000');
      const texto = encodeURIComponent(msg || 'Hola Efra, quiero contarte sobre un proyecto.');
      window.open(`https://wa.me/${numero}?text=${texto}`, '_blank');
    });
  }

  // Correo: arma un mailto con lo escrito
  const mailForm = document.getElementById('mailForm');
  if (mailForm) {
    mailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const asunto = document.getElementById('mailSubject').value.trim() || 'Contacto desde el portafolio';
      const cuerpo = document.getElementById('mailBody').value.trim();
      const destino = getContactInfo('contacto.info.email', 'correo@ejemplo.com');
      window.location.href = `mailto:${destino}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    });
  }
});

// Lee un dato de contacto guardado desde el panel de administrador (/admin.html)
function getContactInfo(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem('crashtechContent') || '{}');
    return saved[key] && saved[key].trim() ? saved[key].trim() : fallback;
  } catch (e) {
    return fallback;
  }
}
