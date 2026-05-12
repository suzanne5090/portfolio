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
