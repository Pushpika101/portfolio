import { portfolio } from '../dom.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let dispose = () => {};

export function mountAboutReveal({defer = false} = {}) {
  dispose();
  const section = portfolio.querySelector('.about-story');
  if (!section) return () => {};
  const card = section.querySelector('.about-details-card');
  const toolkit = section.querySelector('.about-toolkit');
  const visibility = toolkit && 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('is-visible', entry.isIntersecting));
    }, {threshold:.12}) : null;
  if (visibility) visibility.observe(toolkit);
  else toolkit?.classList.add('is-visible');
  let animation;
  let started = false;
  let active = true;
  section.classList.add('about-awaiting');
  card.inert = true;
  function finish() {
    section.classList.remove('about-awaiting');
    card.inert = false;
    animation?.cancel();
  }
  function start() {
    if (!active || started) return;
    started = true;
    if (reduced.matches) { finish(); return; }
    animation = card.animate([
      {transform:'translateY(18vh)', opacity:0},
      {transform:'translateY(0)', opacity:1},
    ], {duration:1200, delay:250, easing:'cubic-bezier(.22,1,.36,1)', fill:'both'});
    section.classList.remove('about-awaiting');
    // Enable the real links immediately; the reveal doesn't trap scrolling.
    card.inert = false;
    animation.finished.then(() => { if (active) finish(); }).catch(() => {});
  }
  const preferenceChanged = () => { if (reduced.matches && started) finish(); };
  reduced.addEventListener('change', preferenceChanged);
  dispose = () => {
    active = false;
    visibility?.disconnect();
    finish();
    reduced.removeEventListener('change', preferenceChanged);
  };
  if (!defer) start();
  return start;
}
