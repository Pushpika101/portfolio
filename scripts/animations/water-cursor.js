import { WaterSurface } from './water-surface.js';

// Refraction uses an inert, clipped copy of the page: SVG backdrop filters
// silently render nothing in some browsers. Ordinary SVG filters have pixels
// to displace here, while the original page keeps handling all interaction.
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const pointer = matchMedia('(any-pointer: fine)');
const size = 576;
const resolution = 192;
const cell = size / resolution;
const water = new WaterSurface(resolution);
const lifetime = 2400;
const canvas = document.createElement('canvas');
canvas.width = canvas.height = resolution;
const context = canvas.getContext('2d');
const svgNS = 'http://www.w3.org/2000/svg';
const definitions = document.createElementNS(svgNS, 'svg');
definitions.setAttribute('class', 'water-cursor-definitions');
definitions.setAttribute('aria-hidden', 'true');
definitions.innerHTML = `<defs><filter id="cursor-water" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feImage width="100%" height="100%" preserveAspectRatio="none" result="water"/><feDisplacementMap in="SourceGraphic" in2="water" scale="70" xChannelSelector="R" yChannelSelector="G"/></filter></defs>`;
const map = definitions.querySelector('feImage');
const surface = document.createElement('div');
surface.className = 'water-cursor';
surface.style.width = surface.style.height = `${size}px`;
surface.setAttribute('aria-hidden', 'true');
surface.inert = true;
const image = document.createElement('div');
image.className = 'water-cursor-image';
const viewport = document.createElement('div');
viewport.className = 'water-cursor-viewport';
image.append(viewport);
surface.append(image);
const highlights = document.createElement('canvas');
highlights.className = 'water-cursor-highlights';
highlights.width = highlights.height = resolution;
const shine = highlights.getContext('2d');
surface.append(highlights);
document.body.append(definitions, surface);
const sources = [...document.querySelectorAll('body > .portfolio, body > .entrance, body > .site-nav')];
let dirty = true;
let lastCopy = 0;
const observer = new MutationObserver(() => { dirty = true; });
sources.forEach(source => observer.observe(source, {subtree:true, childList:true, attributes:true, characterData:true}));
function syncContent(now) {
  if (dirty && now - lastCopy > 80) {
    viewport.replaceChildren(...sources.map(source => {
      const copy = source.cloneNode(true);
      copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      copy.querySelectorAll('dialog, script').forEach(node => node.remove());
      copy.inert = true;
      return copy;
    }));
    dirty = false;
    lastCopy = now;
  }
  viewport.style.width = `${innerWidth}px`;
  viewport.style.height = `${innerHeight}px`;
  const page = viewport.querySelector('.portfolio');
  if (page) page.style.transform = `translateY(${-scrollY}px)`;
}
const pixels = context?.createImageData(resolution, resolution);
const lighting = shine?.createImageData(resolution, resolution);
let pending = [];
let lastMove = 0;
let frame = 0;
let lastPaint = 0;
let previous = null;
let center = null;
let simulationTime = 0;
let speed = 0;

function reset() {
  cancelAnimationFrame(frame);
  frame = 0;
  pending = [];
  water.clear();
  previous = center = null;
  simulationTime = 0;
  lastPaint = 0;
  speed = 0;
  surface.style.opacity = '0';
}

function render(now) {
  frame = 0;
  const idle = now - lastMove;
  if (idle > lifetime || document.hidden) { reset(); return; }
  if (now - lastPaint >= 14) {
    const elapsed = lastPaint ? Math.min(50, now - lastPaint) : 1000 / 60;
    lastPaint = now;
    syncContent(now);
    const target = previous;
    const next = {
      x: Math.round((target.x - size / 2) / cell) * cell,
      y: Math.round((target.y - size / 2) / cell) * cell,
    };
    if (center) water.shift(Math.round((next.x - center.x) / cell), Math.round((next.y - center.y) / cell));
    center = next;
    surface.style.transform = `translate3d(${center.x}px,${center.y}px,0)`;
    viewport.style.transform = `translate(${-center.x}px,${-center.y}px)`;
    for (const stroke of pending) {
      water.stroke((stroke.ax - center.x) / cell, (stroke.ay - center.y) / cell,
        (stroke.bx - center.x) / cell, (stroke.by - center.y) / cell, stroke.strength, stroke.width);
    }
    pending = [];
    // Fixed simulation time keeps the wake consistent across refresh rates.
    simulationTime += elapsed;
    while (simulationTime >= 1000 / 60) {
      water.step();
      simulationTime -= 1000 / 60;
    }
    const h = water.height;
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const i = y * resolution + x;
        const offset = i * 4;
        let nx = 0;
        let ny = 0;
        if (x > 0 && y > 0 && x < resolution - 1 && y < resolution - 1) {
          // Smoothed normals retain sharp reflections without pixel shimmer.
          nx = (2 * (h[i - 1] - h[i + 1]) + h[i - resolution - 1] - h[i - resolution + 1]
            + h[i + resolution - 1] - h[i + resolution + 1]) * .24;
          ny = (2 * (h[i - resolution] - h[i + resolution]) + h[i - resolution - 1] - h[i + resolution - 1]
            + h[i - resolution + 1] - h[i + resolution + 1]) * .24;
        }
        const inverse = 1 / Math.hypot(nx, ny, 1);
        nx *= inverse;
        ny *= inverse;
        pixels.data[offset] = 128 + nx * 120;
        pixels.data[offset + 1] = 128 + ny * 120;
        pixels.data[offset + 2] = 128;
        pixels.data[offset + 3] = 255;
        if (lighting) {
          // Two white reflected area lights with a narrow bright crest.
          // Flat water stays completely transparent; there are no drawn rings.
          const slope = Math.min(1, Math.hypot(nx, ny) * 2.5);
          const key = Math.max(0, nx * -.38 + ny * -.52 + inverse * .765);
          const rim = Math.max(0, nx * .65 + ny * .35 + inverse * .675);
          const specular = Math.pow(key, 64) * 1.15;
          const softReflection = Math.pow(key, 9) * .16;
          const rimLight = Math.pow(rim, 26) * .48;
          const fresnel = (1 - inverse) ** 3 * .22;
          lighting.data[offset] = 255;
          lighting.data[offset + 1] = 255;
          lighting.data[offset + 2] = 255;
          lighting.data[offset + 3] = Math.min(240,
            (slope * .035 + (softReflection + specular + rimLight + fresnel) * slope) * 255);
        }
      }
    }
    context.putImageData(pixels, 0, 0);
    map.setAttribute('href', canvas.toDataURL());
    if (lighting) shine.putImageData(lighting, 0, 0);
    const fade = Math.max(0, Math.min(1, (lifetime - idle) / 900));
    surface.style.opacity = String(fade * fade * (3 - 2 * fade));
  }
  frame = requestAnimationFrame(render);
}

window.addEventListener('pointermove', event => {
  if (!context || motion.matches || !pointer.matches || event.pointerType === 'touch' || document.hidden) return;
  const now = performance.now();
  const point = {x: event.clientX, y: event.clientY, time: now};
  if (previous) {
    const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
    if (distance < 2) return;
    const elapsed = Math.max(1, now - previous.time);
    speed += (Math.min(3, distance / elapsed) - speed) * (1 - Math.exp(-elapsed / 65));
    pending.push({ax: previous.x, ay: previous.y, bx: point.x, by: point.y,
      strength: (.7 + speed * .85) * Math.min(1, distance / 12),
      width: 3.5 + speed * 1.3});
    if (pending.length > 32) pending.shift();
  }
  previous = point;
  lastMove = now;
  if (!frame) frame = requestAnimationFrame(render);
}, {passive: true});

window.addEventListener('blur', reset);
window.addEventListener('resize', reset, {passive: true});
window.addEventListener('scroll', reset, {passive: true});
window.addEventListener('pagehide', reset);
document.documentElement.addEventListener('pointerleave', reset);
document.addEventListener('visibilitychange', reset);
motion.addEventListener('change', reset);
pointer.addEventListener('change', reset);
