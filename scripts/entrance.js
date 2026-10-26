import { entrance, portal, portfolio, theme, state } from "./dom.js";

// Both views render the same image box; hover changes only its clipping window.
export function alignEntrancePortrait() {
  const homeImage = portfolio.querySelector('.portrait img');
  const entranceImage = portal.querySelector('img');
  if (!homeImage || !entranceImage) return;
  const home = homeImage.getBoundingClientRect();
  const windowRect = portal.getBoundingClientRect();
  const offsetX = home.left + home.width / 2 - (windowRect.left + windowRect.width / 2);
  const offsetY = home.top + home.height / 2 - (windowRect.top + windowRect.height / 2);
  Object.assign(entranceImage.style, {
    width: `${home.width}px`,
    height: `${home.height}px`,
    left: `calc(50% + ${offsetX}px)`,
    top: `calc(50% + ${offsetY}px)`,
    objectFit: 'contain',
    objectPosition: '50% 50%',
  });
}
alignEntrancePortrait();
window.addEventListener('resize', alignEntrancePortrait);
document.fonts.ready.then(alignEntrancePortrait);

let frame;
function updateProximity(event) {
  if (state.entering || entrance.classList.contains('dismissed')) return;
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const rect = portal.getBoundingClientRect();
    const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
    const proximity = Math.max(0, Math.min(1, 1 - (distance - 150) / 450));
    portal.style.setProperty('--proximity', proximity.toFixed(3));
  });
}
export async function enter(target = '#home', animate = true) {
  if (state.entering || entrance.classList.contains('dismissed')) return;
  state.entering = true;
  cancelAnimationFrame(frame);
  const rect = portal.getBoundingClientRect();
  entrance.inert = true;
  entrance.classList.add('opening');
  theme.content = '#111210';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (animate && !reduceMotion) {
    // Reveal the real homepage inside the pill, expanding its boundary to the viewport.
    const start = `inset(${rect.top}px ${Math.max(0, innerWidth - rect.right)}px ${Math.max(0, innerHeight - rect.bottom)}px ${rect.left}px round ${rect.height / 2}px)`;
    portfolio.classList.add('revealing');
    const reveal = portfolio.animate([
      {clipPath:start, filter:'blur(10px)'},
      {clipPath:'inset(0px 0px 0px 0px round 0px)', filter:'blur(0px)'}
    ], {duration:1300, easing:'cubic-bezier(.76,0,.24,1)', fill:'forwards'});
    await reveal.finished;
    portfolio.classList.add('active');
    portfolio.classList.remove('revealing');
    reveal.cancel();
  }
  entrance.classList.add('dismissed');
  entrance.classList.remove('opening');
  entrance.setAttribute('aria-hidden', 'true');
  portfolio.inert = false;
  portfolio.setAttribute('aria-hidden', 'false');
  portfolio.classList.add('active');
  const section = document.querySelector(target);
  if (target === '#home') {
    window.scrollTo({top:0, behavior:'instant'});
  } else {
    section?.scrollIntoView({behavior:'instant'});
  }
  const heading = section?.querySelector('h1, h2');
  if (heading) { heading.tabIndex = -1; heading.focus({preventScroll:true}); }
  state.entering = false;
}
document.addEventListener('pointermove', updateProximity);
document.addEventListener('pointerleave', () => {
  cancelAnimationFrame(frame);
  portal.style.setProperty('--proximity', '0');
});
portal.addEventListener('focus', () => portal.style.setProperty('--proximity', '1'));
portal.addEventListener('click', () => enter());

