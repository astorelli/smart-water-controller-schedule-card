#!/usr/bin/env node
// Build a single HACS resource from the three custom cards.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const sources = [
  'src/schedule-card.js',
  'src/overview-card.js',
  'src/zones-card.js'
];
const output = 'smart-water-controller-schedule-card.js';
const parts = sources.map(file => {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) throw new Error('Missing source: ' + file);
  return fs.readFileSync(fullPath, 'utf8');
});
const bundle = parts.join('\n;\n') + '\n';
fs.writeFileSync(path.join(root, output), bundle);
console.log('Created ' + output + ' (' + Buffer.byteLength(bundle) + ' bytes)');
