/**
 * Patches fork-ts-checker-webpack-plugin's nested ajv-keywords/_formatLimit.js
 * to be null-safe for any edge cases where ajv@6 doesn't expose .formats the
 * same way as expected.
 *
 * With npm overrides, fork-ts-checker now gets ajv@6 + ajv-keywords@3 which
 * should work together correctly. This script is kept as a safety net.
 */
const fs   = require('fs');
const path = require('path');

const base = path.resolve(
  __dirname,
  '../node_modules/fork-ts-checker-webpack-plugin/node_modules/ajv-keywords'
);

if (!fs.existsSync(base)) {
  console.log('[patch-ajv] fork-ts-checker nested ajv-keywords not found — skipping (overrides handled it).');
  process.exit(0);
}

// Check if this is ajv-keywords@3 (old) or v5 (new)
const pkgJson = JSON.parse(
  fs.readFileSync(path.join(base, 'package.json'), 'utf8')
);
const ver = parseInt((pkgJson.version || '0').split('.')[0], 10);

if (ver >= 5) {
  console.log('[patch-ajv] fork-ts-checker has ajv-keywords@' + pkgJson.version + ' (v5+) — no patch needed.');
  process.exit(0);
}

console.log('[patch-ajv] fork-ts-checker has ajv-keywords@' + pkgJson.version + ' — applying safety patch.');

const formatPath = path.join(base, 'keywords', '_formatLimit.js');

if (!fs.existsSync(formatPath)) {
  console.log('[patch-ajv] _formatLimit.js not found — skipping.');
  process.exit(0);
}

let content = fs.readFileSync(formatPath, 'utf8');

if (content.includes('/* patched-ajv8 */')) {
  console.log('[patch-ajv] Already patched — skipping.');
  process.exit(0);
}

// In ajv@6, formats live at ajv._formats. Guard against ajv@8 where it's undefined.
const PATTERN = /function extendFormats\(ajv\)\s*\{/;
if (!PATTERN.test(content)) {
  console.log('[patch-ajv] extendFormats not found — skipping.');
  process.exit(0);
}

content = content.replace(
  PATTERN,
  'function extendFormats(ajv) { /* patched-ajv8 */\n  var _f = ajv.formats || ajv._formats; if (!_f) return;'
);

// Remove or guard the next 'var formats = ...' line to avoid double declaration
content = content.replace(/\n\s*var formats = ajv\._?formats;/, '');

fs.writeFileSync(formatPath, content, 'utf8');
console.log('[patch-ajv] Patched _formatLimit.js successfully.');
