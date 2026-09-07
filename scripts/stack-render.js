// ============================================
// Renderiza los chips del Stack (Inicio) desde site_content.
// Se guardan como una lista en JSON dentro de la clave "stack.items".
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('stackGrid');
  if (!grid) return;

  const content = await sbGetContent();
  let items = [];
  try {
    items = JSON.parse(content['stack.items'] || '[]');
  } catch (e) {
    items = [];
  }

  if (items.length === 0) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = items
    .map((item) => `<span class="stack-chip">${escapeStackText(item)}</span>`)
    .join('');
});

function escapeStackText(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
