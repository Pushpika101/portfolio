// Delegation keeps project interactions working after animated page navigation.
const dialog = document.createElement('dialog');
dialog.className = 'project-dialog';
dialog.setAttribute('aria-labelledby', 'project-dialog-title');
dialog.innerHTML = '<button class="project-dialog-close" aria-label="Close project details">×</button><h2 id="project-dialog-title"></h2><div class="project-dialog-content"></div>';
document.body.append(dialog);
let source;
dialog.querySelector('button').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => source?.focus({preventScroll:true}));
document.addEventListener('click', event => {
  const summary = event.target.closest('.project-trigger');
  if (!summary) return;
  event.preventDefault();
  source = summary;
  dialog.querySelector('h2').textContent = summary.querySelector('h3').textContent;
  dialog.querySelector('.project-dialog-content').replaceChildren(summary.parentElement.querySelector('.project-body').cloneNode(true));
  resetHover();
  dialog.showModal();
  dialog.scrollTop = 0;
});

const hoverEnabled = window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeCard;
let bounds;
let hoverFrame;
function resetHover() {
  cancelAnimationFrame(hoverFrame);
  if (activeCard) {
    activeCard.classList.remove('is-hovered');
    for (const property of ['--tilt-x','--tilt-y','--light-x','--light-y']) activeCard.style.removeProperty(property);
  }
  activeCard = null;
}
document.addEventListener('pointermove', event => {
  if (!hoverEnabled.matches || reducedMotion.matches || dialog.open) return;
  const card = event.target.closest('.work-card');
  if (!card) { resetHover(); return; }
  if (card !== activeCard) {
    resetHover();
    activeCard = card;
    bounds = card.getBoundingClientRect();
    card.classList.add('is-hovered');
  }
  const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
  cancelAnimationFrame(hoverFrame);
  hoverFrame = requestAnimationFrame(() => {
    card.style.setProperty('--tilt-x', `${(0.5 - y) * 7}deg`);
    card.style.setProperty('--tilt-y', `${(x - 0.5) * 7}deg`);
    card.style.setProperty('--light-x', `${x * 100}%`);
    card.style.setProperty('--light-y', `${y * 100}%`);
  });
});
document.addEventListener('pointerleave', resetHover);
window.addEventListener('blur', resetHover);
window.addEventListener('scroll', resetHover, {passive:true});
reducedMotion.addEventListener('change', resetHover);
hoverEnabled.addEventListener('change', resetHover);
dialog.addEventListener('close', resetHover);
