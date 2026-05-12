/**
 * Patches fork-ts-checker-webpack-plugin's nested ajv-keywords/_formatLimit.js
 * to be null-safe for ajv@8 (where ajv.formats is undefined).
 *
 * The crash: `var format = formats[name]` where `formats` is undefined in ajv@8.
 * The fix:   `var format = (formats || {})[name]`
 *
 * This runs automatically after `npm install` via the "postinstall" script.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(
  __dirname,
  '../node_modules/fork-ts-checker-webpack-plugin/node_modules/ajv-keywords/keywords/_formatLimit.js'
);

if (!fs.existsSync(filePath)) {
  console.log('[patch-ajv] _formatLimit.js not found — skipping (may already be patched or absent).');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');

if (content.includes('(formats || {})')) {
  console.log('[patch-ajv] Already patched — skipping.');
  process.exit(0);
}

const original = 'var format = formats[name];';
const patched  = 'var format = (formats || {})[name];';

if (!content.includes(original)) {
  console.log('[patch-ajv] Target string not found — file may have changed. Skipping.');
  process.exit(0);
}

content = content.replace(original, patched);
fs.writeFileSync(filePath, content, 'utf8');
console.log('[patch-ajv] Patched _formatLimit.js successfully.');
