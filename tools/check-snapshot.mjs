import assert from 'node:assert/strict';
import { freezePageSnapshot } from '../scripts/animations/page-snapshot.js';

function element(appearance = {}, children = []) {
  const styles = new Map();
  return {
    appearance,
    style: {setProperty: (key, value, priority) => styles.set(key, {value, priority})},
    styles,
    querySelectorAll: () => children,
    querySelector: () => null,
  };
}
const previousGetComputedStyle = globalThis.getComputedStyle;
globalThis.getComputedStyle = node => ({
  getPropertyValue: property => node.appearance[property] || 'none',
});
try {
  // A project mid-deal has inline opacity 0, but a visible animated frame.
  // A contact token's final opacity is supplied entirely by its CSS animation.
  const project = element({opacity:'.73', transform:'matrix(1, 0, 0, 1, 130, 45)'});
  const contact = element({opacity:'1', transform:'matrix(1, 0, 0, 1, 75, 78)'});
  const title = element({opacity:'0', filter:'blur(8px)'});
  const copies = [element(), element(), element()];
  freezePageSnapshot(element({opacity:'1'}, [project, contact, title]), element({}, copies));
  for (const [index, original] of [project, contact, title].entries()) {
    for (const [property, value] of Object.entries(original.appearance)) {
      assert.equal(copies[index].styles.get(property).value, value);
    }
    assert.deepEqual(copies[index].styles.get('animation'), {value:'none', priority:'important'});
    assert.deepEqual(copies[index].styles.get('transition'), {value:'none', priority:'important'});
  }
  console.log('Page snapshots preserve animated card and title frames.');
} finally {
  globalThis.getComputedStyle = previousGetComputedStyle;
}
