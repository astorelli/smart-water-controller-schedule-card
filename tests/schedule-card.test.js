'use strict';
// Run with `npm test` (Node's built-in test runner; the only dependency is jsdom).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWindow, juneSchedule, makeCard, fire } = require('./helpers');

const window = loadWindow();
test.after(() => window.close());

const shadow = card => card.shadowRoot;

test('the card registers its custom element', () => {
  assert.ok(window.customElements.get('smart-water-controller-schedule-card'));
});

test('it shows the stored values of the selected month', () => {
  const { card } = makeCard(window, { schedule: juneSchedule(), station_names: ['ZEN', 'BBQ'] });

  const times = [...shadow(card).querySelectorAll("[data-role='time-slot']")].map(input => input.value);
  assert.deepEqual(times, ['07:00', '21:00']);
  assert.equal(shadow(card).querySelector("[data-role='interval-days']").value, '2');
  const minutes = [...shadow(card).querySelectorAll("[data-role='station-minutes']")].map(input => input.value);
  assert.deepEqual(minutes, ['10', '5']);
});

test('saving sends all twelve months to the controller-specific service', async () => {
  const { card, hass } = makeCard(window, { schedule: juneSchedule() });

  const input = shadow(card).querySelector("[data-role='station-minutes']");
  input.value = '12';
  fire(window, input, 'input');
  await card._saveSchedule();

  assert.equal(hass.calls.length, 1);
  assert.equal(hass.calls[0].domain, 'smart_water_controller');
  assert.equal(hass.calls[0].service, 'set_irrigation_schedule_c8_b9_61_d3_fa_0d');
  assert.equal(hass.calls[0].data.schedule.length, 12);
  assert.equal(hass.calls[0].data.schedule[5].stations.station_1_minutes, 12);
});
