document.addEventListener('DOMContentLoaded', () => {
  // Typewriter: escribe y borra el texto del hero en loop.
  // La palabra se lee desde el span "fantasma" (data-edit-key="hero.title"),
  // así que si el admin la edita, el typewriter se reinicia con el nuevo texto.
  const twEl = document.getElementById('typewriter');
  const ghostEl = document.querySelector('.tw-ghost[data-edit-key="hero.title"]');
  if (!twEl || !ghostEl) return;

  const TYPE_SPEED = 130;
  const DELETE_SPEED = 80;
  const HOLD_TIME = 1600;
  const PAUSE_TIME = 500;

  let word = ghostEl.textContent.trim();
  let i = 0;
  let timer = null;

  function typeLoop() {
    if (i <= word.length) {
      twEl.textContent = word.slice(0, i);
      i++;
      timer = setTimeout(typeLoop, TYPE_SPEED);
    } else {
      timer = setTimeout(deleteLoop, HOLD_TIME);
    }
  }

  function deleteLoop() {
    if (i > 0) {
      i--;
      twEl.textContent = word.slice(0, i);
      timer = setTimeout(deleteLoop, DELETE_SPEED);
    } else {
      timer = setTimeout(typeLoop, PAUSE_TIME);
    }
  }

  // Expuesto para que admin.js lo llame cuando se edite el título del hero
  window.crashRestartTypewriter = function () {
    clearTimeout(timer);
    word = ghostEl.textContent.trim();
    i = 0;
    typeLoop();
  };

  typeLoop();
});
