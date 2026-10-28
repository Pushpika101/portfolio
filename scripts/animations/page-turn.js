// The outgoing page becomes a flexible sheet with real front/back surfaces.
export async function turnPage(previousPage) {
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
    // Let the final curled frame paint before tearing down the DOM textures.
    // Otherwise cleanup competes with the last visible frame of the turn.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    // Detach before cancelling so filled transforms never snap back on screen.
    scene.remove();
    shadow.remove();
    animations.forEach(animation => animation.cancel());
  }
}

