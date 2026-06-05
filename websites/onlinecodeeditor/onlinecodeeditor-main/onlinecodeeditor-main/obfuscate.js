#!/usr/bin/env node
// obfuscate.js – builds dist/ with obfuscated versions of the JS assets
// Run: node obfuscate.js
// Output goes to dist/assets/ so the source files are never overwritten.

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs   = require('fs');
const path = require('path');

const FILES = [
  'assets/app.js',
  'assets/packager.js',
  'assets/translate.js',
  'assets/jszip-mini.js',
];

const OPTIONS = {
  compact:                          true,
  controlFlowFlattening:            false,
  deadCodeInjection:                false,
  debugProtection:                  false,
  disableConsoleOutput:             false,
  identifierNamesGenerator:         'hexadecimal',
  numbersToExpressions:             true,
  renameGlobals:                    false,
  selfDefending:                    false,
  simplify:                         true,
  splitStrings:                     false,
  stringArray:                      true,
  stringArrayCallsTransform:        true,
  stringArrayEncoding:              ['base64'],
  stringArrayIndexShift:            true,
  stringArrayRotate:                true,
  stringArrayShuffle:               true,
  stringArrayWrappersCount:         1,
  stringArrayWrappersChainedCalls:  true,
  stringArrayWrappersParametersMaxCount: 2,
  stringArrayWrappersType:          'variable',
  stringArrayThreshold:             0.75,
  unicodeEscapeSequence:            false,
  sourceType:                       'module',  // ES modules (import/export)
};

const distDir = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

for (const file of FILES) {
  const src     = path.resolve(__dirname, file);
  const dest    = path.resolve(distDir, file);
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  const source = fs.readFileSync(src, 'utf8');
  const result = JavaScriptObfuscator.obfuscate(source, OPTIONS);
  fs.writeFileSync(dest, result.getObfuscatedCode(), 'utf8');
  console.log(`✔ ${file} → dist/${file}`);
}
