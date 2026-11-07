import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// The privacy page renders PRIVACY.md from the app repository, which is the public promise the
// app's code is held to. This copies it verbatim into src/content/privacy.md.
const sourceUrl = 'https://raw.githubusercontent.com/hellotaotao/typealoud/main/PRIVACY.md';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'src/content/privacy.md');
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--from-file')) {
  throw new Error('Usage: node scripts/sync-privacy.mjs [--from-file path/to/PRIVACY.md]');
}

let next;
if (args.length) {
  next = await readFile(resolve(args[1]), 'utf8');
} else {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`PRIVACY.md fetch failed: HTTP ${response.status}`);
  next = await response.text();
}
// Refuse anything that would break the page rather than publish a half-empty policy.
for (const marker of ['# Privacy', '# 隐私说明', 'PostHog']) {
  if (!next.includes(marker)) throw new Error(`PRIVACY.md is missing "${marker}"; existing copy left unchanged`);
}

let previous = '';
try { previous = await readFile(file, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (previous === next) {
  console.log('privacy.md is up to date.');
} else {
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, next);
  await rename(temporary, file);
  console.log('privacy.md updated from PRIVACY.md.');
}
