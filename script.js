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

// The outgoing page becomes a flexible sheet with real front/back surfaces.
async function turnPage(previousPage) {
  const scene = document.createElement('div');
  scene.className = 'book-scene';
  scene.setAttribute('aria-hidden', 'true');
  scene.inert = true;
  const sheet = document.createElement('div');
  sheet.className = 'book-sheet';
  scene.append(sheet);
  const shadow = document.createElement('div');
  shadow.className = 'book-ground-shadow';
  shadow.setAttribute('aria-hidden', 'true');
  const width = innerWidth;
  const height = innerHeight;
  scene.style.perspective = `${Math.max(1800, width * 2)}px`;
  const count = width < 650 ? 12 : 18;
  const stripWidth = width / count;
  const strips = [];
  for (let i = 0; i < count; i++) {
    const strip = document.createElement('div');
    strip.className = 'book-strip';
    strip.style.width = `${stripWidth + 1}px`;
    for (const back of [false, true]) {
      const face = document.createElement('div');
      face.className = back ? 'book-face book-face-back' : 'book-face';
      if (back) {
        // Align the paper finish across the whole sheet, not each segment.
        face.style.backgroundSize = `${width}px 100%`;
        face.style.backgroundPosition = `${-i * stripWidth}px 0`;
      }
      // Only the front needs a DOM texture. The reverse is translucent paper;
      // duplicating the entire page there doubled layout and raster work.
      if (!back) {
        const texture = document.createElement('div');
        texture.className = 'book-texture';
        texture.style.width = `${width}px`;
        texture.style.height = `${height}px`;
        texture.style.left = `${-i * stripWidth}px`;
        const copy = previousPage.firstElementChild.cloneNode(true);
        copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        texture.append(copy);
        face.append(texture);
      }
      strip.append(face);
    }
    sheet.append(strip);
    strips.push(strip);
  }
  // Precompute connected strip positions, then let the compositor interpolate
  // transforms. No per-frame JS or layout reads run during the page turn.
  const frames = Array.from({length:count}, () => []);
  const shadowFrames = [];
  const samples = 90;
  for (let frame = 0; frame <= samples; frame++) {
    const progress = frame / samples;
    const eased = progress * progress * (3 - 2 * progress);
    const curl = Math.sin(eased * Math.PI);
    let x = 0;
    let z = 0;
    for (let i = 0; i < count; i++) {
      // A traveling bend: the free edge folds over while the spine stays flat.
      // Mid-turn, the sheet spans almost 180 degrees instead of tilting as a slab.
      const along = i / (count - 1);
      const local = Math.max(0, Math.min(1, eased + .48 * curl * (2 * along - 1)));
      const theta = Math.PI * local;
      frames[i].push({offset:progress, transform:`translate3d(${x}px,0,${z}px) rotateY(${-theta}rad)`});
      x += Math.cos(theta) * stripWidth;
      z += Math.sin(theta) * stripWidth;
    }
    shadowFrames.push({offset:progress, opacity:curl * .4});
  }
  strips.forEach((strip,i) => {strip.style.transform = frames[i][0].transform;});
  document.body.append(shadow, scene);
  // Give the browser two paint opportunities to prepare textures before moving.
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  previousPage.style.visibility = 'hidden';
  const timing = {duration:1800, easing:'linear', fill:'forwards'};
  const animations = strips.map((strip,i) => strip.animate(frames[i], timing));
  animations.push(shadow.animate(shadowFrames, timing));
  const startTime = document.timeline.currentTime;
  animations.forEach(animation => {animation.startTime = startTime;});
  try {
    await Promise.all(animations.map(animation => animation.finished));
  } finally {
    animations.forEach(animation => animation.cancel());
    scene.remove();
    shadow.remove();
  }
}

async function navigatePage(url, source, push = true) {
  if (navigating || entering) return;
  navigating = true;
  let snapshot;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Page could not be loaded');
    const next = new DOMParser().parseFromString(await response.text(), 'text/html');
    const nextPortfolio = next.querySelector('.portfolio');
    if (!nextPortfolio) throw new Error('Invalid portfolio page');
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
    document.querySelectorAll('.site-nav a').forEach(link => {
      if (link.dataset.page === next.body.dataset.page) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.title = next.title;
    entrance.classList.add('dismissed');
    entrance.inert = true;
    entrance.setAttribute('aria-hidden', 'true');
    portfolio.classList.add('active', 'revealing');
    window.scrollTo({top:0, behavior:'instant'});
    if (push) history.pushState({portfolio:true}, '', url);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      await turnPage(snapshot);
    }
    portfolio.classList.remove('revealing');
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
  if (!link || (!portfolio.contains(link) && !link.closest('.site-nav')) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || !pageFiles.includes(url.pathname.split('/').pop())) return;
  event.preventDefault();
  const currentFile = location.pathname.split('/').pop() || 'index.html';
  if (url.pathname.split('/').pop() === currentFile) return;
  await navigatePage(url.href, link);
});
window.addEventListener('popstate', () => navigatePage(location.href, null, false));
if (document.body.dataset.page === 'home' && location.hash === '#home') enter('#home', false);
