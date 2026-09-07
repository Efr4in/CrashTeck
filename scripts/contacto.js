document.addEventListener('DOMContentLoaded', async () => {
  const toggleBtns = document.querySelectorAll('.method-toggle button');
  const panels = document.querySelectorAll('.method-panel');

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      toggleBtns.forEach(b => b.classList.toggle('active', b === btn));
      panels.forEach(p => p.classList.toggle('active', p.id === target));
    });
  });

  // Traemos el número/correo real guardados desde el dashboard (Supabase)
  const content = await sbGetContent();
  const numeroReal = (content['contacto.info.numero'] || '').trim() || '000000000';
  const correoReal = (content['contacto.info.email'] || '').trim() || 'correo@ejemplo.com';

  // WhatsApp: arma el link con el mensaje escrito
  const waForm = document.getElementById('whatsappForm');
  if (waForm) {
    waForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = document.getElementById('waMessage').value.trim();
      const texto = encodeURIComponent(msg || 'Hola Efra, quiero contarte sobre un proyecto.');
      window.open(`https://wa.me/${numeroReal}?text=${texto}`, '_blank');
    });
  }

  // Correo: arma un mailto con lo escrito
  const mailForm = document.getElementById('mailForm');
  if (mailForm) {
    mailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const asunto = document.getElementById('mailSubject').value.trim() || 'Contacto desde el portafolio';
      const cuerpo = document.getElementById('mailBody').value.trim();
      window.location.href = `mailto:${correoReal}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    });
  }
});
