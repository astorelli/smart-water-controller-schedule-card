#!/usr/bin/env node
// Clean-build check, run by CI and by `npm run check`.
//
// A broken build is silent: the bundle still loads, a card is just missing.
// That is how `npm run build` once replaced the four-card HACS bundle with a
// schedule-only one. This script fails when the build
//   1. is not deterministic (two clean builds differ),
//   2. does not register every card custom element,
//   3. is not what is committed (the committed bundle is stale), or
//   4. is a webpack output instead of the concatenated sources.
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const committed = path.join(root, 'smart-water-controller-schedule-card.js');
const expectedElements = [
  'smart-water-controller-schedule-card',
  'irrigation-summary-card',
  'irrigation-zones-card'
];

const failures = [];
function check(ok, label, detail) {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + label + (ok || !detail ? '' : ' - ' + detail));
  if (!ok) failures.push(label);
}
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function build(out) {
  execFileSync(process.execPath, [path.join(__dirname, 'build.js'), '--out', out], { stdio: 'ignore' });
}

// Runs the bundle against a minimal browser stand-in and records what it registers.
function registrations(file) {
  const defined = [];
  class Element {
    constructor() { this.style = {}; this.dataset = {}; this.children = []; }
    attachShadow() { return new Element(); }
    appendChild() {}
    setAttribute() {}
    addEventListener() {}
    querySelector() { return null; }
    querySelectorAll() { return []; }
  }
  const sandbox = {
    console: { log() {}, info() {}, warn() {}, error() {}, debug() {} },
    HTMLElement: Element,
    customElements: {
      define(name) { defined.push(name); },
      get() { return undefined; },
      whenDefined() { return Promise.resolve(); }
    },
    document: { createElement: () => new Element(), head: new Element(), body: new Element() },
    navigator: { language: 'en' },
    setTimeout, clearTimeout, setInterval, clearInterval
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file, timeout: 5000 });
  const cards = (sandbox.customCards || []).map(card => card.type);
  return { defined, cards };
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'swc-build-'));
try {
  const first = path.join(tmp, 'first.js');
  const second = path.join(tmp, 'second.js');
  try {
    build(first);
    build(second);
  } catch (error) {
    check(false, 'scripts/build.js builds the bundle', 'it exited with an error (see its output above)');
    console.log('\n' + failures.length + ' check(s) failed.');
    process.exit(1);
  }

  check(sha(first) === sha(second), 'two clean builds are byte-identical',
    sha(first).slice(0, 8) + ' vs ' + sha(second).slice(0, 8));

  let result;
  try {
    result = registrations(first);
  } catch (error) {
    check(false, 'the bundle runs without throwing', error.message);
    result = { defined: [], cards: [] };
  }
  for (const name of expectedElements) {
    check(result.defined.includes(name), 'registers <' + name + '>',
      'registered: ' + (result.defined.join(', ') || 'nothing'));
  }
  check(result.defined.length === new Set(result.defined).size, 'no element is registered twice',
    result.defined.join(', '));
  const unknown = result.defined.filter(name => !expectedElements.includes(name));
  check(unknown.length === 0, 'no unexpected element is registered (update expectedElements if you add a card)',
    unknown.join(', '));
  check(!fs.readFileSync(first, 'utf8').includes('__webpack_require__'),
    'the bundle is the concatenated sources, not a webpack output');

  check(fs.existsSync(committed) && sha(committed) === sha(first),
    'the committed bundle equals a clean build',
    'run `npm run build` and commit smart-water-controller-schedule-card.js');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (failures.length) {
  console.log('\n' + failures.length + ' check(s) failed.');
  process.exit(1);
}
console.log('\nBuild is complete, deterministic and committed.');
