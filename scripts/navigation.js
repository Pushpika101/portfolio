import { entrance, portal, portfolio, state } from "./dom.js";
import { alignEntrancePortrait } from "./entrance.js";
import { turnPage } from "./animations/page-turn.js";

const pageFiles = ['index.html', 'about.html', 'projects.html', 'contact.html'];
history.replaceState({portfolio:true}, '', location.href);

async function navigatePage(url, source, push = true) {
  if (state.navigating || state.entering) return;
  state.navigating = true;
  let snapshot;
  try {
    const response = await fetch(url, { cache: 'no-cache' });
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
    state.navigating = false;
  }
}

document.addEventListener('click', async event => {
  const replay = event.target.closest('.replay');
  if (replay) {
    if (state.navigating || state.entering) return;
    if (document.body.dataset.page !== 'home') {
      await navigatePage(new URL('index.html', location.href).href, replay);
    }
    entrance.classList.remove('dismissed'); entrance.inert = false; entrance.removeAttribute('aria-hidden');
    portfolio.inert = true; portfolio.setAttribute('aria-hidden', 'true'); portfolio.classList.remove('active');
    portal.style.setProperty('--proximity', '0');
    window.scrollTo({top:0,behavior:'instant'});
    alignEntrancePortrait();
    portal.focus({preventScroll:true});
    return;
  }
  const link = event.target.closest('a[href]');
  if (!link || (!portfolio.contains(link) && !link.closest('.site-nav')) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || !pageFiles.includes(url.pathname.split('/').pop())) return;
  if (url.pathname === location.pathname && url.hash) return;
  event.preventDefault();
  const currentFile = location.pathname.split('/').pop() || 'index.html';
  if (url.pathname.split('/').pop() === currentFile) return;
  await navigatePage(url.href, link);
});
window.addEventListener('popstate', () => navigatePage(location.href, null, false));
