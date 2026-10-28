import { createProjectCaseStudy, createProjectHero } from './project-gallery.js?v=all-project-layout-39';

// Delegation keeps project interactions working after animated page navigation.
const dialog = document.createElement('dialog');
dialog.className = 'project-dialog';
dialog.setAttribute('aria-labelledby', 'project-dialog-title');
dialog.innerHTML = '<div class="project-dialog-toolbar"><button class="project-dialog-close" aria-label="Close project details">×</button></div><div class="project-hero-slot"></div><div class="project-dialog-content"></div>';
document.body.append(dialog);
const panel = document.createElement('div');
panel.className = 'project-detail-panel';
panel.append(...dialog.childNodes);
dialog.append(panel);
let source;
let sourceCard;
let opening = false;
let closing = false;
let transition = Promise.resolve();
let runningAnimations = [];

function animateCardSwap(reverse = false) {
  if (reducedMotion.matches || !source?.isConnected) return Promise.resolve();
  const from = source.getBoundingClientRect();
  const to = panel.getBoundingClientRect();
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  // Use the real card size, not its larger rotated bounding rectangle.
  const cardWidth = source.offsetWidth;
  const cardHeight = source.offsetHeight;
  const sx = cardWidth / to.width;
  const sy = cardHeight / to.height;
  const orientation = new DOMMatrix(getComputedStyle(sourceCard).transform);
  orientation.m41 = orientation.m42 = orientation.m43 = 0;
  const restingTransform = `perspective(1100px) ${orientation.toString()}`;
  const front = document.createElement('div');
  front.className = 'work-card project-flip-front';
  front.inert = true;
  front.setAttribute('aria-hidden', 'true');
  const cover = source.cloneNode(true);
  cover.removeAttribute('id');
  cover.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
  cover.tabIndex = -1;
  front.append(cover);
  Object.assign(front.style, {
    left:`${from.left + (from.width - cardWidth) / 2}px`,
    top:`${from.top + (from.height - cardHeight) / 2}px`,
    width:`${cardWidth}px`, height:`${cardHeight}px`,
  });
  dialog.append(front);
  const frontFrames = [
    {offset:0, opacity:1, transform:restingTransform},
    {offset:.48, opacity:1, transform:`perspective(1400px) translate(${-dx * .75}px,${-dy * .75}px) rotateY(90deg) scale(${1 / sx},${1 / sy})`},
    {offset:.49, opacity:0, transform:`perspective(1400px) translate(${-dx}px,${-dy}px) rotateY(90deg) scale(${1 / sx},${1 / sy})`},
    {offset:1, opacity:0, transform:'rotateY(90deg)'},
  ];
  const backFrames = [
    {offset:0, opacity:0, transform:`perspective(1400px) translate(${dx}px,${dy}px) rotateY(-90deg) scale(${sx},${sy})`},
    {offset:.47, opacity:0, transform:`perspective(1400px) translate(${dx * .25}px,${dy * .25}px) rotateY(-90deg) scale(.92)`},
    {offset:.49, opacity:1, transform:`perspective(1400px) translate(${dx * .25}px,${dy * .25}px) rotateY(-88deg) scale(.92)`},
    {offset:1, opacity:1, transform:'perspective(1400px) translate(0,0) rotateY(0deg) scale(1)'},
  ];
  const timing = {duration:reverse ? 1000 : 1400, easing:'cubic-bezier(.35,0,.15,1)', fill:'both', direction:reverse ? 'reverse' : 'normal'};
  runningAnimations = [front.animate(frontFrames,timing),panel.animate(backFrames,timing)];
  const start = document.timeline.currentTime;
  runningAnimations.forEach(animation => {animation.startTime = start;});
  return Promise.all(runningAnimations.map(animation => animation.finished)).catch(() => {}).finally(() => {
    if (reverse) {
      // Restore the real card and remove the modal from the top layer BEFORE
      // cancelling its final frame, otherwise the full-size panel flashes back.
      sourceCard?.style.removeProperty('visibility');
      dialog.close();
    }
    runningAnimations.forEach(animation => animation.cancel());
    runningAnimations = [];
    front.remove();
  });
}
async function closeProject() {
  if (closing || !dialog.open) return;
  closing = true;
  if (opening) await transition;
  await animateCardSwap(true);
  if (dialog.open) {
    sourceCard?.style.removeProperty('visibility');
    dialog.close();
  }
  closing = false;
}
panel.querySelector('button').addEventListener('click', closeProject);
dialog.addEventListener('cancel', event => {event.preventDefault();closeProject();});
dialog.addEventListener('click', event => {
  if (event.target === dialog) closeProject();
});
dialog.addEventListener('close', () => {
  if (sourceCard) sourceCard.style.removeProperty('visibility');
  source?.focus({preventScroll:true});
});
// Resizing should finish the current transition rather than leave a stale clone.
window.addEventListener('resize', () => runningAnimations.forEach(animation => animation.finish()));
document.addEventListener('click', event => {
  const summary = event.target.closest('.portfolio .project-trigger');
  if (!summary || dialog.open || opening || closing) return;
  event.preventDefault();
  source = summary;
  sourceCard = summary.closest('.work-card');
  panel.querySelector('.project-hero-slot').replaceChildren(createProjectHero(summary));
  panel.classList.add('project-opening');
  panel.querySelector('.project-dialog-content').replaceChildren(createProjectCaseStudy(summary));
  resetHover();
  dialog.showModal();
  panel.scrollTop = 0;
  opening = true;
  transition = animateCardSwap();
  sourceCard.style.visibility = 'hidden';
  transition.finally(() => { opening = false; panel.classList.remove('project-opening'); });
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
    for (const property of ['--tilt-x','--tilt-y','--light-x','--light-y','--parallax-x','--parallax-y','--lift-x','--lift-y']) activeCard.style.removeProperty(property);
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
    card.style.setProperty('--tilt-x', `${(0.5 - y) * 12}deg`);
    card.style.setProperty('--tilt-y', `${(x - 0.5) * 12}deg`);
    card.style.setProperty('--light-x', `${x * 100}%`);
    card.style.setProperty('--light-y', `${y * 100}%`);
    card.style.setProperty('--parallax-x', `${(x - 0.5) * -18}px`);
    card.style.setProperty('--parallax-y', `${(y - 0.5) * -14}px`);
    card.style.setProperty('--lift-x', `${(x - 0.5) * 7}px`);
    card.style.setProperty('--lift-y', `${(y - 0.5) * 6}px`);
  });
});
document.addEventListener('pointerleave', resetHover);
window.addEventListener('blur', resetHover);
window.addEventListener('scroll', resetHover, {passive:true});
reducedMotion.addEventListener('change', resetHover);
hoverEnabled.addEventListener('change', resetHover);
dialog.addEventListener('close', resetHover);
