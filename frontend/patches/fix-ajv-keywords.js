/**
 * Replaces fork-ts-checker-webpack-plugin's nested ajv-keywords with a no-op
 * version that is fully compatible with ajv@8.
 *
 * Why: fork-ts-checker-webpack-plugin ships ajv-keywords@3.x (built for ajv@6).
 * On Node 24 with ajv@8, _formatLimit.js crashes both at load-time AND at
 * webpack compilation time. This is a JS-only project — no TypeScript checking
 * is needed, so the entire nested ajv-keywords can safely be a no-op.
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

// No-op implementations — safe replacements for ajv@8
const INDEX_NOOP = `'use strict';
// patched: no-op for ajv@8 compatibility (fork-ts-checker-webpack-plugin)
module.exports = function(ajv) { return ajv; };
module.exports.get = function() { return function(ajv) { return ajv; }; };
`;

const FORMAT_LIMIT_NOOP = `'use strict';
// patched: no-op for ajv@8 compatibility
module.exports = function defFunc(ajv) {
  defFunc.definition = { type: 'string', validate: function() { return true; }, errors: false };
  return defFunc;
};
`;

const indexPath  = path.join(base, 'index.js');
const formatPath = path.join(base, 'keywords', '_formatLimit.js');

let patched = 0;

if (fs.existsSync(indexPath) && !fs.readFileSync(indexPath, 'utf8').includes('patched')) {
  fs.writeFileSync(indexPath, INDEX_NOOP, 'utf8');
  console.log('[patch-ajv] Replaced ajv-keywords/index.js with no-op.');
  patched++;
}

if (fs.existsSync(formatPath) && !fs.readFileSync(formatPath, 'utf8').includes('patched')) {
  fs.writeFileSync(formatPath, FORMAT_LIMIT_NOOP, 'utf8');
  console.log('[patch-ajv] Replaced ajv-keywords/_formatLimit.js with no-op.');
  patched++;
}

if (patched === 0) {
  console.log('[patch-ajv] Already patched — skipping.');
} else {
  console.log('[patch-ajv] Done. ' + patched + ' file(s) replaced.');
}
