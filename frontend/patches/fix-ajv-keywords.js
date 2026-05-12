/**
 * Patches fork-ts-checker-webpack-plugin's nested ajv-keywords/_formatLimit.js
 * to be null-safe for ajv@8 (where ajv.formats / ajv._formats is undefined).
 *
 * In ajv@6 formats live at ajv._formats (private) or ajv.formats (getter).
 * In ajv@8 neither exists in the same way → extendFormats() crashes.
 * Fix: inject early return guard so the function is a no-op under ajv@8.
 */
const fs   = require('fs');
const path = require('path');

const filePath = path.resolve(
  __dirname,
  '../node_modules/fork-ts-checker-webpack-plugin/node_modules/ajv-keywords/keywords/_formatLimit.js'
);

if (!fs.existsSync(filePath)) {
  console.log('[patch-ajv] _formatLimit.js not found — skipping.');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');

if (content.includes('/* patched-ajv8 */')) {
  console.log('[patch-ajv] Already patched — skipping.');
  process.exit(0);
}

// Log first 300 chars so we can debug if the pattern changes again
console.log('[patch-ajv] File preview (first 400 chars):\n' + content.slice(0, 400));

// Match either:  var formats = ajv.formats;
//            or  var formats = ajv._formats;
// (ajv-keywords v3.x uses _formats internally; some builds differ)
const PATTERN = /var formats = ajv\._?formats;/;

if (!PATTERN.test(content)) {
  console.error('[patch-ajv] ERROR: Could not find formats assignment — aborting patch.');
  console.error('[patch-ajv] Proceeding anyway (build may still crash).');
  process.exit(0);
}

content = content.replace(
  PATTERN,
  'var formats = ajv.formats || ajv._formats; /* patched-ajv8 */\n  if (!formats) return;'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('[patch-ajv] Patched _formatLimit.js successfully.');
