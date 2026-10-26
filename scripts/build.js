#!/usr/bin/env node
// Build one HACS JavaScript module from the four readable source modules.
//
//   node scripts/build.js              writes smart-water-controller-schedule-card.js
//   node scripts/build.js --out FILE   writes FILE instead (scripts/check-build.js uses this)
//
// The schedule card is read from src/smart-water-controller-schedule-card.js,
// the maintained source. It used to be read from src/schedule-card.js, a
// minified snapshot of an earlier build, so editing the maintained source had
// no effect on the shipped bundle.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const inputs = [
  'src/smart-water-controller-schedule-card.js',
  'src/schedule-style.js',
  'src/overview-card.js',
  'src/zones-card.js'
];
const outIndex = process.argv.indexOf('--out');
if (outIndex !== -1 && !process.argv[outIndex + 1]) throw new Error('--out needs a file name');
const destination = outIndex === -1
  ? path.join(root, 'smart-water-controller-schedule-card.js')
  : path.resolve(process.argv[outIndex + 1]);
for (const input of inputs) {
  const full = path.join(root, input);
  if (!fs.existsSync(full)) throw new Error('Missing source: ' + input);
  execFileSync(process.execPath, ['--check', full], { stdio: 'inherit' });
}
const bundle = inputs.map(p => fs.readFileSync(path.join(root,p), 'utf8')).join('\n;\n') + '\n';
fs.writeFileSync(destination, bundle);
execFileSync(process.execPath, ['--check', destination], { stdio: 'inherit' });
console.log('Built '+destination+' ('+Buffer.byteLength(bundle)+' bytes)');
