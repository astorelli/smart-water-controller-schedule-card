#!/usr/bin/env node
// Build one HACS JavaScript module from the four source modules.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const inputs = [
  'src/schedule-card.js',
  'src/schedule-style.js',
  'src/overview-card.js',
  'src/zones-card.js'
];
for (const input of inputs) {
  const full = path.join(root, input);
  if (!fs.existsSync(full)) throw new Error('Missing source: ' + input);
  execFileSync(process.execPath, ['--check', full], { stdio: 'inherit' });
}
const bundle = inputs.map(p => fs.readFileSync(path.join(root,p), 'utf8')).join('\n;\n') + '\n';
const destination = path.join(root, 'smart-water-controller-schedule-card.js');
fs.writeFileSync(destination, bundle);
execFileSync(process.execPath, ['--check', destination], { stdio: 'inherit' });
console.log('Built '+destination+' ('+Buffer.byteLength(bundle)+' bytes)');
