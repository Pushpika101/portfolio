const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let dispose = () => {};

// Prepare the title before navigation; start the cards only after the page turn.
export function mountProjectOrbit({defer = false} = {}) {
  dispose();
  const section = document.querySelector('.portfolio .selected-work');
  if (!section) return () => {};
  const grid = section.querySelector('.project-grid');
  const cards = [...grid.querySelectorAll('.work-card')];
  const title = section.querySelector('.selected-heading h2');
  const controls = document.createElement('div');
  controls.className = 'orbit-controls';
  controls.innerHTML = '<span>SELECT A PROJECT TO EXPLORE</span><button type="button" class="orbit-view" aria-pressed="false">View grid</button>';
  section.append(controls);
  section.classList.add('orbit-running');
  section.setAttribute('aria-label', 'Selected projects');
  grid.inert = true;
  controls.hidden = true;
  cards.forEach(card => {card.style.opacity = '0';});
  const view = controls.querySelector('button');
  let animations = [];
  let titleAnimation;
  let started = false;
  let finished = false;
  let gridView = false;
  let alive = true;
  let generation = 0;

  function pose(index, progress) {
    const angle = index / cards.length * Math.PI * 2 - Math.PI / 2;
    const eased = progress * progress * (3 - 2 * progress);
    const sweep = angle - (1 - eased) * Math.PI * 1.35;
    const rx = Math.max(20, (grid.clientWidth - cards[0].offsetWidth) * .43);
    const ry = Math.max(20, (grid.clientHeight - cards[0].offsetHeight) * .39);
    const x = Math.cos(sweep) * rx * eased + (index - 2) * 4 * (1 - eased);
    const y = Math.sin(sweep) * ry * eased + (index - 2) * 3 * (1 - eased);
    const tilt = (index - 2) * 5 * (1 - eased) + Math.cos(angle) * 24 * eased;
    return `translate(-50%,-50%) translate3d(${x}px,${y}px,${index * 3 * (1 - eased)}px) rotateZ(${tilt}deg) rotateY(${Math.cos(sweep) * -10 * eased}deg) scale(${.88 + eased * .12})`;
  }
  function settle() {
    finished = true;
    animations.forEach(animation => animation.cancel());
    animations = [];
    cards.forEach((card, index) => {
      card.style.transform = gridView ? '' : pose(index, 1);
      card.style.opacity = '1';
    });
    section.classList.add('orbit-intro-complete');
    grid.inert = false;
    controls.hidden = false;
  }
  function arrange() {
    if (!started || gridView) return;
    if (finished || reduced.matches) { settle(); return; }
    const elapsed = Number(animations[0]?.currentTime) || 0;
    const run = ++generation;
    animations.forEach(animation => animation.cancel());
    animations = cards.map((card, index) => {
      const frames = [
        {offset:0, opacity:0, transform:pose(index, 0)},
        {offset:.12, opacity:1, transform:pose(index, 0)},
        {offset:.34, opacity:1, transform:pose(index, 0)},
        ...Array.from({length:49}, (_, step) => ({
          offset:.35 + step / 48 * .65, opacity:1, transform:pose(index, step / 48),
        })),
      ];
      const animation = card.animate(frames, {duration:3000, delay:400 + index * 80, fill:'both', easing:'linear'});
      animation.currentTime = elapsed;
      return animation;
    });
    Promise.all(animations.map(animation => animation.finished)).then(() => {
      if (alive && run === generation) settle();
    }).catch(() => {}); // Resizing or navigating away cancels the old sequence.
  }
  const resize = new ResizeObserver(arrange);
  resize.observe(grid);
  function start() {
    if (!alive || started) return;
    started = true;
    if (reduced.matches) { settle(); return; }
    titleAnimation = title.animate([
      {opacity:1, transform:'translateY(0)', filter:'blur(0)'},
      {opacity:0, transform:'translateY(-18px)', filter:'blur(8px)'},
    ], {duration:700, delay:1000, fill:'forwards', easing:'ease-in'});
    titleAnimation.finished.then(() => {
      if (alive) section.classList.add('orbit-intro-complete');
    }).catch(() => {});
    arrange();
  }
  view.addEventListener('click', () => {
    gridView = !gridView;
    section.classList.toggle('orbit-grid-view', gridView);
    view.textContent = gridView ? 'View circle' : 'View grid';
    view.setAttribute('aria-pressed', String(gridView));
    titleAnimation?.cancel();
    settle();
  });
  dispose = () => {
    alive = false;
    animations.forEach(animation => animation.cancel());
    titleAnimation?.cancel();
    resize.disconnect();
    controls.remove();
    grid.inert = false;
    cards.forEach(card => {card.style.removeProperty('opacity');card.style.removeProperty('transform');});
    section.classList.remove('orbit-running', 'orbit-grid-view', 'orbit-intro-complete');
  };
  if (!defer) start();
  return start;
}
reduced.addEventListener('change', () => mountProjectOrbit());
