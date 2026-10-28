import assert from 'node:assert/strict';
import { turnPage } from '../scripts/animations/page-turn.js';
const recorded = [];
const lifecycle = [];
function node() {
  return {
    style:{}, setAttribute() {}, append() {}, remove() { lifecycle.push("remove"); },
    cloneNode: node, querySelectorAll: () => [],
    animate(frames, timing) {
      recorded.push({frames, timing});
      return {finished:Promise.resolve(), cancel() { lifecycle.push("cancel"); }};
    },
  };
}
globalThis.document = {createElement:node, body:node(), timeline:{currentTime:0}};
globalThis.requestAnimationFrame = callback => { lifecycle.push("frame"); callback(); };
globalThis.innerHeight = 900;
for (const width of [390, 1440]) {
  globalThis.innerWidth = width;
  recorded.length = 0;
  lifecycle.length = 0;
  await turnPage({firstElementChild:node(), style:{}});
  const strips = recorded.filter(({frames}) => 'transform' in frames[0]);
  assert.equal(strips.length, width < 650 ? 12 : 18);
  for (const {frames, timing} of strips) {
    assert.equal(timing.duration, 1800);
    const angles = frames.map(frame => Math.abs(Number(frame.transform.match(/rotateY\(([^r]+)rad/)[1])));
    assert.equal(angles[0], 0);
    assert.ok(Math.abs(angles.at(-1) - Math.PI) < 1e-10);
    assert.ok(angles.every(angle => angle >= 0 && angle <= Math.PI));
    assert.equal(frames.length, 91);

  }
  assert.deepEqual(lifecycle.slice(0, 4), ["frame", "frame", "frame", "frame"]);
  assert.ok(lifecycle.indexOf("remove") < lifecycle.indexOf("cancel"));
}
console.log('Original 3D turn geometry restored; final frame paints before cleanup.');
