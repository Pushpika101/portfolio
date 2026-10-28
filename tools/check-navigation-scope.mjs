import assert from 'node:assert/strict';

// During navigation the outgoing snapshot still contains a .portfolio tree.
// With an unrelated destination, no animation mount may discover that tree.
const liveQueries = [];
const livePortfolio = {
  querySelector(selector) { liveQueries.push(selector); return null; },
};
globalThis.document = {
  querySelector(selector) {
    if (selector === '.portfolio') return livePortfolio;
    if (selector.startsWith('.portfolio ')) {
      throw new Error(`Animation selected the outgoing snapshot: ${selector}`);
    }
    return {};
  },
};
globalThis.matchMedia = () => ({matches:false, addEventListener() {}});
const { mountProjectOrbit } = await import('../scripts/animations/project-orbit.js');
const { mountContactReveal } = await import('../scripts/animations/contact-reveal.js');
const { mountAboutReveal } = await import('../scripts/animations/about-reveal.js');
for (const mount of [mountProjectOrbit, mountContactReveal, mountAboutReveal]) {
  const start = mount({defer:true});
  assert.equal(typeof start, 'function');
  start();
}
assert.deepEqual(liveQueries, ['.selected-work', '.contact-stage', '.about-story']);
console.log('Page animation mounts ignore outgoing snapshots.');
