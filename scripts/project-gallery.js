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
  // Classify both copies of each flowing row so the loop stays seamless.
  const images = [...plane.querySelectorAll('.project-gallery-tile > img')];
  if (images.length) {
    hero.classList.add('gallery-loading');
    Promise.all(images.map(async image => {
      try { await image.decode(); } catch { return; }
      const ratio = image.naturalWidth / image.naturalHeight;
      const tile = image.parentElement;
      if (ratio < .6) {
        tile.classList.add('gallery-mobile');
        tile.style.setProperty('--tile-ratio', String(ratio));
      } else if (ratio < .95) {
        tile.classList.add('gallery-portrait');
      }
    })).then(() => hero.classList.remove('gallery-loading'));
  }
  const copy = document.createElement('div');
  copy.className = 'project-hero-copy';
  const category = document.createElement('span');
  category.className = 'project-hero-category';
  category.textContent = trigger.querySelector('.work-meta span')?.textContent || 'Selected project';
  const title = document.createElement('h2');
  title.id = 'project-dialog-title';
  title.textContent = trigger.querySelector('h3').textContent;
  copy.append(category, title);
  const resources = trigger.parentElement.querySelector('template.project-resources');
  if (resources) copy.append(resources.content.cloneNode(true));
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

function projectVisual(trigger, photos, index, className) {
  const frame = document.createElement('div');
  frame.className = className;
  const visual = photos.length
    ? photos[index % photos.length].cloneNode(true)
    : trigger.querySelector('.work-cover').cloneNode(true);
  visual.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
  if (visual.tagName === 'IMG') {
    visual.alt = '';
    visual.loading = 'lazy';
  }
  frame.append(visual);
  return frame;
}

function chapterHeading(index, label, title) {
  const heading = document.createElement('div');
  heading.className = 'pathfinder-chapter-heading';
  heading.innerHTML = `<span>${index}</span><div><small>${label}</small><h4>${title}</h4></div>`;
  return heading;
}

// Projects without a custom case study still receive the same image-led chapter
// layout. Their existing editable text and folder images remain the data source.
export function createProjectCaseStudy(trigger) {
  const source = trigger.parentElement.querySelector('.project-body');
  if (source.classList.contains('pathfinder-details')) return source.cloneNode(true);

  const result = document.createElement('div');
  result.className = 'project-body project-case-study generic-project-case';
  const gallery = trigger.parentElement.querySelector('template.project-gallery');
  const photos = [...(gallery?.content.querySelectorAll('img') || [])];
  const title = trigger.querySelector('h3')?.textContent || 'Selected project';
  const category = trigger.querySelector('.work-meta span')?.textContent || 'Digital product';
  const introText = source.querySelector('.project-intro')?.textContent || 'Add a short explanation of the project and who it helps.';
  const paragraphs = [...source.querySelectorAll(':scope > p')];
  const headings = [...source.querySelectorAll(':scope > h4')];
  const copyFor = label => {
    const heading = headings.find(item => item.textContent.trim().toLowerCase() === label.toLowerCase());
    return heading?.nextElementSibling?.textContent || `Add the ${label.toLowerCase()} details for this project.`;
  };

  const intro = document.createElement('header');
  intro.className = 'pathfinder-case-intro';
  intro.innerHTML = `<span class="project-section-label">${category}</span><h4>${title}</h4><p></p>`;
  intro.querySelector('p').textContent = introText;

  const grid = document.createElement('div');
  grid.className = 'generic-case-grid';
  grid.append(chapterHeading('01', 'EXPERIENCE', 'What people see and use.'));
  grid.append(projectVisual(trigger, photos, 0, 'pathfinder-panel generic-case-visual generic-case-visual-large'));

  const featurePanel = document.createElement('article');
  featurePanel.className = 'pathfinder-panel generic-case-copy';
  featurePanel.innerHTML = '<div class="pathfinder-panel-copy"><span class="project-section-label">KEY FEATURES</span><h4>Designed around the core experience.</h4></div>';
  const features = source.querySelector('.feature-list')?.cloneNode(true);
  if (features) {
    features.className = 'pathfinder-feature-pills';
    featurePanel.querySelector('.pathfinder-panel-copy').append(features);
  }
  grid.append(featurePanel);

  grid.append(chapterHeading('02', 'THE BUILD', 'How the product comes together.'));
  const buildPanel = document.createElement('article');
  buildPanel.className = 'pathfinder-panel generic-case-copy generic-case-build';
  buildPanel.innerHTML = '<div class="pathfinder-panel-copy"><span class="project-section-label">OVERVIEW</span><h4>The solution.</h4><p></p></div>';
  buildPanel.querySelector('p').textContent = copyFor('Overview');
  const tech = source.querySelector('.tech-tags')?.cloneNode(true);
  if (tech) buildPanel.querySelector('.pathfinder-panel-copy').append(tech);
  grid.append(buildPanel, projectVisual(trigger, photos, 1, 'pathfinder-panel generic-case-visual'));

  grid.append(chapterHeading('03', 'OUTCOME', 'What was delivered and learned.'));
  const contribution = document.createElement('article');
  contribution.className = 'pathfinder-panel generic-case-copy';
  contribution.innerHTML = '<div class="pathfinder-panel-copy"><span class="project-section-label">MY CONTRIBUTION</span><h4>Work and decisions.</h4><p></p></div>';
  contribution.querySelector('p').textContent = copyFor('My contribution');
  grid.append(projectVisual(trigger, photos, 2, 'pathfinder-panel generic-case-visual'), contribution);

  const outcome = document.createElement('article');
  outcome.className = 'pathfinder-panel generic-case-result';
  outcome.innerHTML = '<div class="pathfinder-panel-copy"><span class="project-section-label">THE RESULT</span><h4>Outcome &amp; learnings.</h4><p></p></div>';
  outcome.querySelector('p').textContent = copyFor('Outcome & learnings');
  const facts = source.querySelector('.project-facts')?.cloneNode(true);
  if (facts) outcome.querySelector('.pathfinder-panel-copy').append(facts);
  grid.append(outcome);

  const links = source.querySelector('.project-links')?.cloneNode(true);
  if (links) {
    links.classList.add('generic-case-links');
    grid.append(links);
  }
  result.append(intro, grid);
  return result;
}
