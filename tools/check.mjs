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
for (const screen of screens) {
  const html = await renderScreen(screen);
  assert.equal(await readFile(screen.file, 'utf8'), html, `${screen.file} is stale: run npm run build`);
  assert.ok(html.includes(`id="${screen.name}"`));
  assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
  assert.ok(html.includes('type="module" src="script.js"'));
  assert.ok(!html.includes('{{'));
}
console.log('All scripts and four generated screens passed checks.');
