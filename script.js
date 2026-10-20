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

const pageFiles = ['index.html', 'about.html', 'projects.html', 'contact.html'];
let navigating = false;
history.replaceState({portfolio:true}, '', location.href);

async function navigatePage(url, source, push = true) {
  if (navigating || entering) return;
  navigating = true;
  let snapshot;
  let animation;
  let colorReveal;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Page could not be loaded');
    const next = new DOMParser().parseFromString(await response.text(), 'text/html');
    const nextPortfolio = next.querySelector('.portfolio');
    if (!nextPortfolio) throw new Error('Invalid portfolio page');
    const rect = source?.getBoundingClientRect();
    const oldScroll = window.scrollY;
    snapshot = document.createElement('div');
    snapshot.className = 'page-snapshot';
    snapshot.inert = true;
    snapshot.setAttribute('aria-hidden', 'true');
    const previous = portfolio.cloneNode(true);
    previous.style.transform = `translateY(-${oldScroll}px)`;
    snapshot.append(previous);
    document.body.append(snapshot);
    document.body.classList.add('page-changing');
    portfolio.inert = true;
    portfolio.innerHTML = nextPortfolio.innerHTML;
    document.body.dataset.page = next.body.dataset.page;
    document.title = next.title;
    entrance.classList.add('dismissed');
    entrance.inert = true;
    entrance.setAttribute('aria-hidden', 'true');
    portfolio.classList.add('active', 'revealing');
    window.scrollTo({top:0, behavior:'instant'});
    if (push) history.pushState({portfolio:true}, '', url);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const r = rect || {top:36, right:innerWidth / 2 + 40, bottom:72, left:innerWidth / 2 - 40, height:36};
      // Keep capsule ends round; overscan until even the viewport corners
      // sit inside the pill, rather than morphing it into a rectangle.
      const overscan = Math.max(innerWidth, innerHeight);
      const finalRadius = (innerHeight + overscan * 2) / 2;
      const finalInset = `-${overscan}px -${overscan}px -${overscan}px -${overscan}px`;
      const bounds = [
        {clipPath:`inset(${Math.max(0,r.top)}px ${Math.max(0,innerWidth-r.right)}px ${Math.max(0,innerHeight-r.bottom)}px ${Math.max(0,r.left)}px round ${r.height/2}px)`},
        {clipPath:`inset(${finalInset} round ${finalRadius}px)`}
      ];
      const timing = {duration:1200, easing:'cubic-bezier(.76,0,.24,1)', fill:'forwards'};
      colorReveal = document.createElement('div');
      colorReveal.className = 'page-color-reveal';
      colorReveal.setAttribute('aria-hidden', 'true');
      document.body.append(colorReveal);
      animation = portfolio.animate(bounds, timing);
      // A transparent sage outline tracks the clipping boundary. The actual
      // destination stays visible inside the expanding pill from the first frame.
      const colorExpansion = colorReveal.animate([
        {
          inset:`${Math.max(0,r.top)}px ${Math.max(0,innerWidth-r.right)}px ${Math.max(0,innerHeight-r.bottom)}px ${Math.max(0,r.left)}px`,
          borderRadius:`${r.height/2}px`, borderColor:'#c1d0ad'
        },
        {inset:finalInset, borderRadius:`${finalRadius}px`, borderColor:'#c1d0ad'}
      ], timing);
      await Promise.all([animation.finished, colorExpansion.finished]);
      colorReveal.remove();
    }
    portfolio.classList.remove('revealing');
    animation?.cancel();
    snapshot.remove();
    document.body.classList.remove('page-changing');
    portfolio.inert = false;
    portfolio.setAttribute('aria-hidden','false');
    const heading = portfolio.querySelector('h1,h2');
    if (heading) {heading.tabIndex = -1;heading.focus({preventScroll:true});}
  } catch (error) {
    // Real HTML destinations also work if fetch or animation is unavailable.
    window.location.assign(url);
  } finally {
    colorReveal?.remove();
    navigating = false;
  }
}

document.addEventListener('click', async event => {
  const replay = event.target.closest('.replay');
  if (replay) {
    if (navigating || entering) return;
    if (document.body.dataset.page !== 'home') {
      await navigatePage(new URL('index.html', location.href).href, replay);
    }
    entrance.classList.remove('dismissed'); entrance.inert = false; entrance.removeAttribute('aria-hidden');
    portfolio.inert = true; portfolio.setAttribute('aria-hidden', 'true'); portfolio.classList.remove('active');
    portal.style.setProperty('--proximity', '0');
    window.scrollTo({top:0,behavior:'instant'}); portal.focus({preventScroll:true});
    return;
  }
  const link = event.target.closest('a[href]');
  if (!link || !portfolio.contains(link) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || !pageFiles.includes(url.pathname.split('/').pop())) return;
  event.preventDefault();
  const currentFile = location.pathname.split('/').pop() || 'index.html';
  if (url.pathname.split('/').pop() === currentFile) return;
  await navigatePage(url.href, link);
});
window.addEventListener('popstate', () => navigatePage(location.href, null, false));
if (document.body.dataset.page === 'home' && location.hash === '#home') enter('#home', false);
