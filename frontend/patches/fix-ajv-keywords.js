/**
 * Patches fork-ts-checker-webpack-plugin's nested dependencies for Node 24 compatibility.
 *
 * The "Unknown keyword formatMinimum" error comes from some file inside
 * fork-ts-checker's nested node_modules calling:
 *   ajvKeywords(ajv, ['formatMinimum', ...])
 * with the top-level ajv-keywords@5, which dropped formatMinimum in v5.
 *
 * Strategy: recursively scan fork-ts-checker's nested node_modules for any .js
 * file containing ajvKeywords() calls and comment them out.
 */
const fs   = require('fs');
const path = require('path');

const nodeModules   = path.resolve(__dirname, '../node_modules');
const forkTsBase    = path.join(nodeModules, 'fork-ts-checker-webpack-plugin');

if (!fs.existsSync(forkTsBase)) {
  console.log('[patch-ajv] fork-ts-checker-webpack-plugin not found — skipping.');
  process.exit(0);
}

// ─── Recursive scanner ──────────────────────────────────────────────────────
let patchCount = 0;

function patchFile(filePath) {
  let content;
  try { content = fs.readFileSync(filePath, 'utf8'); } catch (_) { return; }

  if (!content.includes('ajvKeywords(')) return;
  if (content.includes('/* patched-validate */'))  return;

  const patched = content.replace(
    /ajvKeywords\([^)]+\);/g,
    '/* patched-validate: ajvKeywords removed for Node 24 / ajv-keywords@5 compat */'
  );

  if (patched === content) return; // regex didn't match

  fs.writeFileSync(filePath, patched, 'utf8');
  const rel = filePath.replace(nodeModules + path.sep, '');
  console.log('[patch-ajv] ✓ Patched: ' + rel);
  patchCount++;
}

function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
  for (const e of entries) {
    if (e.name === '.bin') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full);
    } else if (e.isFile() && e.name.endsWith('.js')) {
      patchFile(full);
    }
  }
}

console.log('[patch-ajv] Scanning fork-ts-checker nested node_modules…');
walk(path.join(forkTsBase, 'node_modules'));

if (patchCount === 0) {
  console.log('[patch-ajv] No ajvKeywords() calls found in nested node_modules.');
} else {
  console.log('[patch-ajv] Patched ' + patchCount + ' file(s).');
}

// ─── Also fix _formatLimit.js (ajv._formats not initialised in ajv@6) ────────
const formatLimitPath = path.join(
  forkTsBase,
  'node_modules/ajv-keywords/keywords/_formatLimit.js'
);

if (fs.existsSync(formatLimitPath)) {
  let content = fs.readFileSync(formatLimitPath, 'utf8');
  if (!content.includes('/* patched */') && /var formats = ajv\._?formats;/.test(content)) {
    content = content.replace(
      /var formats = ajv\._?formats;/,
      'var formats = ajv._formats || ajv.formats || {}; /* patched */'
    );
    fs.writeFileSync(formatLimitPath, content, 'utf8');
    console.log('[patch-ajv] ✓ Patched _formatLimit.js (ajv._formats fallback).');
  }
}

console.log('[patch-ajv] Done.');
