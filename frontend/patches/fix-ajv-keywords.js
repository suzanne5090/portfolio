/**
 * Patches fork-ts-checker-webpack-plugin's nested dependencies for Node 24 compatibility.
 *
 * Problem chain (module load order, before webpack even starts):
 *   1. react-scripts webpack config requires fork-ts-checker-webpack-plugin
 *   2. fork-ts-checker's node_modules/schema-utils/dist/validate.js loads
 *   3. validate.js:56 calls ajvKeywords(ajv, ['formatMinimum', ...]) as a SIDE EFFECT
 *   4. ajvKeywords resolves to TOP-LEVEL ajv-keywords@5 (no formatMinimum) → CRASH
 *
 * Fix: Remove ajvKeywords() call from fork-ts-checker's validate.js.
 * This is safe because:
 * - ForkTsCheckerWebpackPlugin is already filtered in craco.config.js (JS-only project)
 * - formatMinimum/formatMaximum keywords are not needed for this project's validation
 */
const fs   = require('fs');
const path = require('path');

const nodeModules = path.resolve(__dirname, '../node_modules');

// ─── Patch 1: validate.js — remove ajvKeywords() side-effect call ─────────────
const validatePath = path.join(
  nodeModules,
  'fork-ts-checker-webpack-plugin/node_modules/schema-utils/dist/validate.js'
);

if (fs.existsSync(validatePath)) {
  let content = fs.readFileSync(validatePath, 'utf8');
  if (content.includes('ajvKeywords(') && !content.includes('/* patched-validate */')) {
    content = content.replace(
      /ajvKeywords\([^)]+\);/g,
      '/* patched-validate: ajvKeywords removed for Node 24 compatibility */'
    );
    fs.writeFileSync(validatePath, content, 'utf8');
    console.log('[patch-ajv] ✓ Patched schema-utils/validate.js (removed ajvKeywords call).');
  } else if (content.includes('/* patched-validate */')) {
    console.log('[patch-ajv] schema-utils/validate.js already patched.');
  } else {
    console.log('[patch-ajv] ajvKeywords call not found in validate.js — skipping.');
  }
} else {
  console.log('[patch-ajv] fork-ts-checker nested schema-utils not found — skipping validate patch.');
}

// ─── Patch 2: _formatLimit.js — safe fallback for uninitialised ajv._formats ──
const formatLimitPath = path.join(
  nodeModules,
  'fork-ts-checker-webpack-plugin/node_modules/ajv-keywords/keywords/_formatLimit.js'
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
  } else {
    console.log('[patch-ajv] _formatLimit.js already patched or not found.');
  }
} else {
  console.log('[patch-ajv] fork-ts-checker nested ajv-keywords not found — skipping formatLimit patch.');
}

console.log('[patch-ajv] Done.');
