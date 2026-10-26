'use strict';
// Shared setup for the schedule-card tests: a jsdom window with the real card
// source evaluated in it, the way the browser evaluates the bundle.
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const SOURCE = path.resolve(__dirname, '..', 'src', 'smart-water-controller-schedule-card.js');
const SENSOR = 'sensor.solem_controller_status';

// A fresh window per test file. Close it when done: the card arms timers, and
// an open jsdom window keeps the test process alive.
function loadWindow() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  dom.window.eval(fs.readFileSync(SOURCE, 'utf8'));
  return dom.window;
}

function emptyMonths() {
  return Array.from({ length: 12 }, () => ({ hours: [], stations: {}, interval_days: 0 }));
}

// June has two times, two stations and an interval; the other months are empty.
function juneSchedule() {
  const months = emptyMonths();
  months[5] = {
    hours: ['07:00:00', '21:00:00'],
    stations: { station_1_minutes: 10, station_2_minutes: 5 },
    interval_days: 2
  };
  return months;
}

function makeHass(attributes) {
  const calls = [];
  return {
    calls,
    states: { [SENSOR]: { entity_id: SENSOR, state: 'On', attributes } },
    callService(domain, service, data) {
      calls.push({ domain, service, data });
      return Promise.resolve();
    }
  };
}

// A card attached to the document and fed a Home Assistant state, showing June.
function makeCard(window, attributes, config = {}) {
  const card = new (window.customElements.get('smart-water-controller-schedule-card'))();
  window.document.body.appendChild(card);
  const hass = makeHass({ service_prefix: 'c8_b9_61_d3_fa_0d', ...attributes });
  card.setConfig({ sensor: SENSOR, ...config });
  card.hass = hass;
  card.currentMonth = 5;
  card.render();
  return { card, hass };
}

function fire(window, element, type) {
  element.dispatchEvent(new window.Event(type, { bubbles: true }));
}

module.exports = { SENSOR, loadWindow, emptyMonths, juneSchedule, makeHass, makeCard, fire };
