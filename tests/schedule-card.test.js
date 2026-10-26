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

// Station names, the title, entity ids and error messages all come from Home
// Assistant or from the dashboard YAML and were interpolated into innerHTML.

test('station names and the title are shown as text, not interpreted as markup', () => {
  const { card } = makeCard(
    window,
    { schedule: juneSchedule(), station_names: ['Zona "Nord" <b>x</b>', 'BBQ'] },
    { header: true, title: '<img src=x onerror=alert(1)>' }
  );

  const label = shadow(card).querySelector('.station-label');
  assert.equal(label.textContent.trim(), 'Zona "Nord" <b>x</b>');
  assert.equal(label.querySelectorAll('*').length, 0);

  const title = shadow(card).querySelector('.card-header-title .name');
  assert.equal(title.textContent.trim(), '<img src=x onerror=alert(1)>');
  assert.equal(title.querySelectorAll('*').length, 0);
});

test('quotes in stored keys and times cannot break out of an attribute', () => {
  const months = juneSchedule();
  months[5].stations = { 'station_1_minutes" data-injected="1': 3 };
  months[5].hours = ['"><img src=x>'];
  const { card } = makeCard(window, { schedule: months });

  assert.equal(shadow(card).querySelectorAll('[data-injected]').length, 0);
  assert.equal(shadow(card).querySelectorAll('img').length, 0);
});

test('a status message is shown as text', () => {
  const { card } = makeCard(window, { schedule: juneSchedule() });
  card._setStatus('<b>boom</b>', 'error');

  const status = shadow(card).querySelector('.status');
  assert.equal(status.textContent, '<b>boom</b>');
  assert.equal(status.querySelectorAll('*').length, 0);
});

test('a configured sensor that does not exist is named as text', () => {
  const card = new (window.customElements.get('smart-water-controller-schedule-card'))();
  window.document.body.appendChild(card);
  card.setConfig({ sensor: 'sensor.<i>nope</i>' });
  card.hass = { states: {}, callService() {} };

  const placeholder = shadow(card).querySelector('.placeholder');
  assert.match(placeholder.textContent, /sensor\.<i>nope<\/i>/);
  assert.equal(placeholder.querySelectorAll('*').length, 0);
});