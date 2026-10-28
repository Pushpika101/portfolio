// Each project can supply its own screenshots inside a template.project-gallery.
// Until then, its existing cover artwork provides an honest preview placeholder.
export function createProjectHero(trigger) {
  const hero = document.createElement('section');
  hero.className = 'project-hero';
  const gallery = document.createElement('div');
  gallery.className = 'project-hero-gallery';
  gallery.setAttribute('aria-hidden', 'true');
  const plane = document.createElement('div');
  plane.className = 'project-gallery-plane';
  const photos = [...(trigger.parentElement.querySelector('template.project-gallery')?.content.querySelectorAll('img') || [])];
  for (let row = 0; row < 2; row++) {
    const track = document.createElement('div');
    track.className = 'project-gallery-track';
    const group = document.createElement('div');
    group.className = 'project-gallery-group';
    for (let index = 0; index < Math.max(3, photos.length); index++) {
      const tile = document.createElement('div');
      tile.className = `project-gallery-tile gallery-variant-${index % 3}`;
      const visual = photos.length
        ? photos[(index + row) % photos.length].cloneNode(true)
        : trigger.querySelector('.work-cover').cloneNode(true);
      visual.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      if (visual.tagName === 'IMG') {
        visual.alt = '';
        visual.loading = 'eager';
        visual.decoding = 'async';
      }
      tile.append(visual);
      group.append(tile);
    }
    track.append(group, group.cloneNode(true));
    plane.append(track);
  }
  gallery.append(plane);
  const copy = document.createElement('div');
  copy.className = 'project-hero-copy';
  const category = document.createElement('span');
  category.className = 'project-hero-category';
  category.textContent = trigger.querySelector('.work-meta span')?.textContent || 'Selected project';
  const title = document.createElement('h2');
  title.id = 'project-dialog-title';
  title.textContent = trigger.querySelector('h3').textContent;
  copy.append(category, title);
  const caption = document.createElement('span');
  caption.className = 'project-gallery-caption';
  caption.textContent = photos.length ? 'A closer look' : 'Project imagery coming soon';
  const pause = document.createElement('button');
  pause.className = 'project-gallery-pause';
  pause.type = 'button';
  pause.textContent = 'Pause motion';
  pause.setAttribute('aria-pressed', 'false');
  pause.addEventListener('click', () => {
    const paused = hero.classList.toggle('gallery-paused');
    pause.setAttribute('aria-pressed', String(paused));
    pause.textContent = paused ? 'Resume motion' : 'Pause motion';
  });
  hero.append(gallery, copy, caption, pause);
  return hero;
}
