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
