let dispose = () => {};

// Keep the incoming page title alone until the page turn has finished.
export function mountContactReveal({defer = false} = {}) {
  dispose();
  const section = document.querySelector('.portfolio .contact-stage');
  if (!section) return () => {};
  const tokens = section.querySelector('.contact-tokens');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  section.classList.add('contact-prepared');
  tokens.inert = true;
  const reveal = () => { tokens.inert = false; };
  const onEnd = event => {
    if (event.target === tokens.lastElementChild) reveal();
  };
  const onMotion = () => { if (reduced.matches) reveal(); };
  tokens.addEventListener('animationend', onEnd);
  reduced.addEventListener('change', onMotion);
  const start = () => {
    section.classList.add('contact-started');
    if (reduced.matches) reveal();
  };
  dispose = () => {
    tokens.removeEventListener('animationend', onEnd);
    reduced.removeEventListener('change', onMotion);
    tokens.inert = false;
    section.classList.remove('contact-prepared', 'contact-started');
  };
  if (!defer) start();
  return start;
}
