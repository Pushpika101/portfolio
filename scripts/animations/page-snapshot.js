// DOM clones do not inherit Web Animations state, and CSS animations restart.
// Bake the rendered frame into inline styles before the live page is replaced.
export function freezePageSnapshot(source, copy) {
  const originals = [source, ...source.querySelectorAll('*')];
  const clones = [copy, ...copy.querySelectorAll('*')];
  const properties = [
    'opacity', 'visibility', 'transform', 'transform-origin',
    'translate', 'rotate', 'scale', 'filter', 'clip-path',
  ];
  originals.forEach((original, index) => {
    const appearance = getComputedStyle(original);
    const frozen = clones[index];
    for (const property of properties) {
      frozen.style.setProperty(property, appearance.getPropertyValue(property));
    }
    frozen.style.setProperty('animation', 'none', 'important');
    frozen.style.setProperty('transition', 'none', 'important');
  });
  // Preserve layout dimensions that otherwise depend on the destination body's
  // data-page attribute or on the viewport wrapper used by the turning strips.
  const main = source.querySelector('main');
  const frozenMain = copy.querySelector('main');
  if (main && frozenMain) {
    frozenMain.style.minHeight = getComputedStyle(main).minHeight;
  }
  freezeAboutSnapshot(source, copy);
}

// Sticky elements are positioned by the live document's scroll container.
// A clone inside a turning strip has a different scroll container, so freeze
// the About layers at their current document-relative positions first.
export function freezeAboutSnapshot(source, copy) {
  const story = source.querySelector('.about-story');
  const frozenStory = copy.querySelector('.about-story');
  if (!story || !frozenStory) return;
  const origin = story.getBoundingClientRect();
  Object.assign(frozenStory.style, {
    position:'relative', width:`${origin.width}px`, height:`${origin.height}px`,
  });
  frozenStory.classList.remove('about-awaiting');
  for (const selector of ['.about-scene', '.about-details-card']) {
    const live = story.querySelector(selector);
    const frozen = frozenStory.querySelector(selector);
    if (!live || !frozen) continue;
    const bounds = live.getBoundingClientRect();
    const appearance = getComputedStyle(live);
    Object.assign(frozen.style, {
      position:'absolute',
      top:`${bounds.top - origin.top}px`,
      left:`${bounds.left - origin.left}px`,
      width:`${bounds.width}px`, height:`${bounds.height}px`,
      margin:'0', transform:'none', transition:'none', animation:'none',
      opacity:appearance.opacity,
    });
  }
  // Preserve each icon's current floating position instead of snapping it back.
  const icons = story.querySelectorAll('.about-tech img');
  frozenStory.querySelectorAll('.about-tech img').forEach((icon, index) => {
    icon.style.transform = getComputedStyle(icons[index]).transform;
    icon.style.animation = 'none';
  });
}
