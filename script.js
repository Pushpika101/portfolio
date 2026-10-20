const entrance = document.querySelector('.entrance');
const portal = document.querySelector('.portal');
const portfolio = document.querySelector('.portfolio');
const theme = document.querySelector('meta[name="theme-color"]');
let frame;
let entering = false;
function updateProximity(event) {
  if (entering || entrance.classList.contains('dismissed')) return;
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const rect = portal.getBoundingClientRect();
    const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
    const proximity = Math.max(0, Math.min(1, 1 - (distance - 100) / 340));
    portal.style.setProperty('--proximity', proximity.toFixed(3));
  });
}
async function enter(target = '#home', animate = true) {
  if (entering || entrance.classList.contains('dismissed')) return;
  entering = true;
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
    ], {duration:1250, easing:'cubic-bezier(.76,0,.24,1)', fill:'forwards'});
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
  entering = false;
}
document.addEventListener('pointermove', updateProximity);
document.addEventListener('pointerleave', () => portal.style.setProperty('--proximity', '0'));
portal.addEventListener('focus', () => portal.style.setProperty('--proximity', '1'));
portal.addEventListener('click', () => enter());
document.querySelector('.skip').addEventListener('click', () => enter('#home', false));
document.querySelector('.monogram').addEventListener('click', event => {event.preventDefault();enter();});
document.querySelector('.replay').addEventListener('click', () => {
  history.replaceState(null, '', location.pathname + location.search);
  entrance.classList.remove('dismissed'); entrance.inert = false; entrance.removeAttribute('aria-hidden');
  portfolio.inert = true; portfolio.setAttribute('aria-hidden', 'true'); portfolio.classList.remove('active');
  theme.content = '#111210'; portal.style.setProperty('--proximity', '0');
  window.scrollTo({top:0,behavior:'instant'}); portal.focus({preventScroll:true});
});
if (['#home','#about','#work','#contact'].includes(location.hash)) enter(location.hash, false);
