/**
 * Postinstall: replaces fork-ts-checker-webpack-plugin with a no-op stub.
 *
 * Why:
 *  - This is a JavaScript-only project (no TypeScript) — the plugin provides zero value.
 *  - It's already filtered out in craco.config.js at webpack config time.
 *  - BUT react-scripts still requires the package at config-build time, which
 *    triggers its nested schema-utils → ajvKeywords(ajv, ['formatMinimum', ...])
 *    side effect. On Node 24 with ajv-keywords@5, 'formatMinimum' is gone → CRASH.
 *
 * Solution: replace its dist/index.js with a no-op webpack plugin class that
 * has zero dependencies on ajv, schema-utils, or ajv-keywords.
 */
const fs   = require('fs');
const path = require('path');

const base = path.resolve(
  __dirname,
  '../node_modules/fork-ts-checker-webpack-plugin'
);

if (!fs.existsSync(base)) {
  console.log('[patch-fork-ts] fork-ts-checker-webpack-plugin not found — skipping.');
  process.exit(0);
}

// Determine the package's main entry from its package.json
let pkgMain = 'dist/index.js';
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(base, 'package.json'), 'utf8'));
  pkgMain = pkg.main || 'dist/index.js';
} catch (_) {}

const entryPath = path.join(base, pkgMain);

// If already stubbed, skip
if (fs.existsSync(entryPath)) {
  const existing = fs.readFileSync(entryPath, 'utf8');
  if (existing.includes('/* no-op stub */')) {
    console.log('[patch-fork-ts] Already stubbed — skipping.');
    process.exit(0);
  }
}

// No-op webpack plugin stub — zero imports, zero ajv/schema-utils dependency
const STUB = `'use strict';
/* no-op stub — replaced by postinstall for Node 24 / ajv-keywords@5 compat */

class ForkTsCheckerWebpackPlugin {
  constructor() {}
  apply(compiler) {}
  static getCompilerHooks(compiler) {
    return {
      start: { tap: function() {} },
      waiting: { tap: function() {} },
      canceled: { tap: function() {} },
      error: { tap: function() {} },
      issues: { tap: function() {} },
    };
  }
}

module.exports = ForkTsCheckerWebpackPlugin;
module.exports.default = ForkTsCheckerWebpackPlugin;
module.exports.ForkTsCheckerWebpackPlugin = ForkTsCheckerWebpackPlugin;
`;

// Ensure the directory exists
fs.mkdirSync(path.dirname(entryPath), { recursive: true });
fs.writeFileSync(entryPath, STUB, 'utf8');
console.log('[patch-fork-ts] ✓ Replaced ' + pkgMain + ' with no-op stub.');
console.log('[patch-fork-ts] Done.');

// ─── No-op stub for _formatLimit.js ──────────────────────────────────────────
// formatMinimum / formatMaximum are unused in this JS-only project.
// Replacing the file completely avoids all ajv@6 vs ajv@8 _formats incompatibility.
const FORMAT_LIMIT_NOOP = `'use strict';
/* no-op: formatMinimum/formatMaximum removed — unused in this JS project */
module.exports = function defFunc(ajv) { return defFunc; };
module.exports.definition = { type: 'string', validate: function() { return true; } };
`;

function patchFormatLimit(dir) {
  // v3 stores keywords in keywords/ subdir
  const candidates = [
    path.join(dir, 'keywords', '_formatLimit.js'),
    path.join(dir, 'dist', 'keywords', '_formatLimit.js'),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const existing = fs.readFileSync(p, 'utf8');
    if (existing.includes('/* no-op:')) {
      console.log('[patch-ajv] Already no-op: ' + p.replace(nodeModules + '/', ''));
      continue;
    }
    fs.writeFileSync(p, FORMAT_LIMIT_NOOP, 'utf8');
    console.log('[patch-ajv] ✓ Replaced with no-op: ' + p.replace(nodeModules + '/', ''));
  }
}

// Patch top-level ajv-keywords
const nodeModules = path.resolve(__dirname, '../node_modules');
const topLevelAjvKw = path.join(nodeModules, 'ajv-keywords');
if (fs.existsSync(topLevelAjvKw)) {
  try {
    const kwPkg = JSON.parse(fs.readFileSync(path.join(topLevelAjvKw, 'package.json'), 'utf8'));
    console.log('[patch-ajv] Top-level ajv-keywords: v' + kwPkg.version);
    patchFormatLimit(topLevelAjvKw);
  } catch (e) {
    console.log('[patch-ajv] Could not patch top-level ajv-keywords: ' + e.message);
  }
}

// Patch any nested ajv-keywords (e.g. inside other plugins)
const nestedPattern = /[\\/]node_modules[\\/](.+)[\\/]node_modules[\\/]ajv-keywords$/;
function walkForNestedAjvKw(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
  for (const e of entries) {
    if (!e.isDirectory() || e.name === '.bin') continue;
    const full = path.join(dir, e.name);
    if (e.name === 'ajv-keywords' && nestedPattern.test(full)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(full, 'package.json'), 'utf8'));
        console.log('[patch-ajv] Found nested ajv-keywords v' + pkg.version + ' at ' + full.replace(nodeModules + '/', ''));
        patchFormatLimit(full);
      } catch (_) {}
    } else {
      walkForNestedAjvKw(full);
    }
  }
}
walkForNestedAjvKw(nodeModules);

console.log('[patch-ajv] All done.');
