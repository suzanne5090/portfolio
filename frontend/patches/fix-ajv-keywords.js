/**
 * Patches fork-ts-checker-webpack-plugin's nested ajv-keywords@3.x
 *
 * ROOT CAUSE: In ajv@6.12.6, ajv._formats is undefined until ajv.addFormat()
 * is called. ajv-keywords@3.5.2's extendFormats() reads ajv._formats immediately
 * and crashes with "Cannot read properties of undefined (reading 'date')" because
 * COMPARE_FORMATS = { date:..., time:..., 'date-time':... } is iterated and
 * formats['date'] fails when formats = undefined.
 *
 * FIX: Replace `var formats = ajv._formats;` (or ajv.formats)
 *      with  `var formats = ajv._formats || ajv.formats || {};`
 *
 * With the empty-object fallback:
 * - If _formats not yet initialized → {} (no side effect, no crash)
 * - If _formats is set               → works as intended
 */
const fs   = require('fs');
const path = require('path');

const base = path.resolve(
  __dirname,
  '../node_modules/fork-ts-checker-webpack-plugin/node_modules/ajv-keywords'
);

if (!fs.existsSync(base)) {
  console.log('[patch-ajv] fork-ts-checker nested ajv-keywords not found — skipping.');
  process.exit(0);
}

const pkgJson = JSON.parse(
  fs.readFileSync(path.join(base, 'package.json'), 'utf8')
);
const ver = parseInt((pkgJson.version || '0').split('.')[0], 10);

if (ver >= 5) {
  console.log('[patch-ajv] ajv-keywords@' + pkgJson.version + ' (v5+) — no patch needed.');
  process.exit(0);
}

const formatPath = path.join(base, 'keywords', '_formatLimit.js');

if (!fs.existsSync(formatPath)) {
  console.log('[patch-ajv] _formatLimit.js not found — skipping.');
  process.exit(0);
}

let content = fs.readFileSync(formatPath, 'utf8');

if (content.includes('/* patched */')) {
  console.log('[patch-ajv] Already patched — skipping.');
  process.exit(0);
}

// Match either variant: ajv._formats  or  ajv.formats
const PATTERN = /var formats = ajv\._?formats;/;

if (!PATTERN.test(content)) {
  console.error('[patch-ajv] Pattern not found — cannot patch. File content:');
  console.error(content.slice(0, 600));
  process.exit(0);
}

// Replace with a safe fallback that returns {} when _formats is not yet initialized
content = content.replace(
  PATTERN,
  'var formats = ajv._formats || ajv.formats || {}; /* patched */'
);

fs.writeFileSync(formatPath, content, 'utf8');
console.log('[patch-ajv] Patched _formatLimit.js — ajv._formats fallback applied.');
