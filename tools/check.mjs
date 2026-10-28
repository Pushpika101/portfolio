import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { screens, renderScreen } from './build.mjs';
async function checkJS(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await checkJS(path);
    else if (/\.(mjs|js)$/.test(path)) execFileSync(process.execPath, ['--check', path]);
  }
}
execFileSync(process.execPath, ['--check', 'script.js']);
await checkJS('scripts');
await checkJS('tools');
await import('./check-snapshot.mjs');
execFileSync(process.execPath, ['tools/check-page-turn.mjs'], {stdio:'inherit'});
execFileSync(process.execPath, ['tools/check-navigation-scope.mjs'], {stdio:'inherit'});
for (const screen of screens) {
  const html = await renderScreen(screen);
  assert.equal(await readFile(screen.file, 'utf8'), html, `${screen.file} is stale: run npm run build`);
  assert.ok(html.includes(`id="${screen.name}"`));
  assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
  assert.match(html, /type="module" src="script\.js\?v=[^"]+"/);
  assert.match(html, /href="style\.css\?v=[^"]+"/);
  if (screen.name === 'projects') assert.ok(html.includes('class="selected-work orbit-ready"'));
  assert.ok(!html.includes('{{'));
}
console.log('All scripts and four generated screens passed checks.');
