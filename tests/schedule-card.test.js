'use strict';
// Run with `npm test` (Node's built-in test runner; the only dependency is jsdom).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWindow, emptyMonths, juneSchedule, makeCard, fire, plain } = require('./helpers');

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
// A field that is empty while the user retypes it is not a value. Writing it
// through on every keystroke stored 07:00:00 for a time and 0 for a number.

test('clearing a time field does not store 07:00:00', () => {
  const { card } = makeCard(window, { schedule: juneSchedule() });
  const second = shadow(card).querySelectorAll("[data-role='time-slot']")[1];

  second.value = '';
  fire(window, second, 'input');
  assert.equal(card.scheduleData[5].hours[1], '21:00:00');
  assert.equal(card._isDirty, false);

  second.value = '21:45';
  fire(window, second, 'input');
  assert.equal(card.scheduleData[5].hours[1], '21:45:00');
  assert.equal(card._isDirty, true);
});

test('clearing the interval or the minutes does not reset them to 0', () => {
  const { card } = makeCard(window, { schedule: juneSchedule() });
  const interval = shadow(card).querySelector("[data-role='interval-days']");
  const minutes = shadow(card).querySelector("[data-role='station-minutes']");

  interval.value = '';
  fire(window, interval, 'input');
  minutes.value = '';
  fire(window, minutes, 'input');
  assert.equal(card.scheduleData[5].interval_days, 2);
  assert.equal(card.scheduleData[5].stations.station_1_minutes, 10);

  interval.value = '3';
  fire(window, interval, 'input');
  minutes.value = '12';
  fire(window, minutes, 'input');
  assert.equal(card.scheduleData[5].interval_days, 3);
  assert.equal(card.scheduleData[5].stations.station_1_minutes, 12);
});

test('leaving a field empty puts the stored value back on screen', () => {
  const { card } = makeCard(window, { schedule: juneSchedule() });
  const clear = (selector, index = 0) => {
    const input = shadow(card).querySelectorAll(selector)[index];
    input.value = '';
    fire(window, input, 'input');
    fire(window, input, 'change');
  };

  clear("[data-role='time-slot']", 1);
  clear("[data-role='interval-days']");
  clear("[data-role='station-minutes']");

  assert.equal(shadow(card).querySelectorAll("[data-role='time-slot']")[1].value, '21:00');
  assert.equal(shadow(card).querySelector("[data-role='interval-days']").value, '2');
  assert.equal(shadow(card).querySelector("[data-role='station-minutes']").value, '10');
});

test('a negative number is stored as 0 and shown as 0', () => {
  const { card } = makeCard(window, { schedule: juneSchedule() });
  const minutes = shadow(card).querySelector("[data-role='station-minutes']");

  minutes.value = '-4';
  fire(window, minutes, 'change');
  assert.equal(card.scheduleData[5].stations.station_1_minutes, 0);
  assert.equal(shadow(card).querySelector("[data-role='station-minutes']").value, '0');
});

test('the card does not impose upper limits of its own on minutes or days', () => {
  // What the controller can carry is for the integration and the toolkit to
  // validate; the card is also used with other controllers.
  const { card } = makeCard(window, { schedule: juneSchedule() });
  const minutes = shadow(card).querySelector("[data-role='station-minutes']");
  const interval = shadow(card).querySelector("[data-role='interval-days']");

  minutes.value = '5000';
  fire(window, minutes, 'change');
  interval.value = '60';
  fire(window, interval, 'change');
  assert.equal(card.scheduleData[5].stations.station_1_minutes, 5000);
  assert.equal(card.scheduleData[5].interval_days, 60);
});

test('saving refuses a time it cannot read instead of replacing it', async () => {
  const months = juneSchedule();
  months[5].hours = ['07:00:00', 'nonsense'];
  const { card, hass } = makeCard(window, { schedule: months });

  await card._saveSchedule();

  assert.equal(hass.calls.length, 0);
  assert.equal(card._status.type, 'error');
  assert.match(card._status.message, /nonsense/);
  assert.deepEqual(plain(card.scheduleData[5].hours), ['07:00:00', 'nonsense']);
});

test('saving completes a time written as HH:MM', async () => {
  const months = juneSchedule();
  months[5].hours = ['21:30'];
  const { card, hass } = makeCard(window, { schedule: months });

  await card._saveSchedule();

  assert.deepEqual(plain(hass.calls[0].data.schedule[5].hours), ['21:30:00']);
});
// Every render() replaces the whole shadow DOM. A status message (the save
// confirmation, and the timer that clears it) used to call render(), which
// threw away the field the user was typing in.

test('a status message keeps the focused field and the typed text', () => {
  const { card } = makeCard(window, { schedule: juneSchedule() });
  const input = shadow(card).querySelector("[data-role='station-minutes']");
  input.focus();
  input.value = '17';
  fire(window, input, 'input');

  card._setStatus('Saved.', 'success');

  const after = shadow(card).querySelector("[data-role='station-minutes']");
  assert.equal(after, input, 'the input element was replaced');
  assert.equal(shadow(card).activeElement, input);
  assert.equal(after.value, '17');
  assert.equal(shadow(card).querySelector("[data-role='status']").textContent, 'Saved.');
});

test('the timer that clears the status does not redraw the card either', () => {
  const { card } = makeCard(window, { schedule: juneSchedule() });
  const input = shadow(card).querySelector("[data-role='station-minutes']");

  const original = window.setTimeout;
  let clear;
  window.setTimeout = callback => {
    clear = callback;
    return 1;
  };

  try {
    card._setStatus('Saved.', 'success');
  } finally {
    window.setTimeout = original;
  }

  input.focus();
  clear();

  assert.equal(shadow(card).querySelector("[data-role='station-minutes']"), input);
  assert.equal(shadow(card).activeElement, input);
  assert.equal(shadow(card).querySelector("[data-role='status']").textContent, '');
});
// Edits live in the card until Save. Nothing showed that, and a schedule
// changed elsewhere while the card held edits was dropped without a word.

const badge = card => shadow(card).querySelector("[data-role='dirty-badge']");
const externalNotice = card => shadow(card).querySelector("[data-role='external-notice']");

test('unsaved edits are announced without redrawing the field being edited', () => {
  const { card } = makeCard(window, { schedule: juneSchedule() });
  assert.equal(badge(card).hidden, true);

  const input = shadow(card).querySelector("[data-role='station-minutes']");
  input.focus();
  input.value = '12';
  fire(window, input, 'input');

  assert.equal(badge(card).hidden, false);
  assert.equal(shadow(card).querySelector("[data-action='reload-schedule']").hidden, false);
  assert.equal(shadow(card).querySelector("[data-role='station-minutes']"), input);
  assert.equal(shadow(card).activeElement, input);
});

test('the badge disappears once the schedule is saved', async () => {
  const { card } = makeCard(window, { schedule: juneSchedule() });
  const input = shadow(card).querySelector("[data-role='station-minutes']");
  input.value = '12';
  fire(window, input, 'input');

  await card._saveSchedule();

  assert.equal(badge(card).hidden, true);
  assert.equal(shadow(card).querySelector("[data-action='reload-schedule']").hidden, true);
});

test('a change made elsewhere while editing is announced and the edit is kept', () => {
  const { card, hass } = makeCard(window, { schedule: juneSchedule() });
  const input = shadow(card).querySelector("[data-role='station-minutes']");
  input.value = '12';
  fire(window, input, 'input');
  assert.equal(externalNotice(card).hidden, true);

  const changed = juneSchedule();
  changed[5].interval_days = 9;
  hass.states['sensor.solem_controller_status'].attributes.schedule = changed;
  card.hass = hass;

  assert.equal(externalNotice(card).hidden, false);
  assert.equal(card.scheduleData[5].stations.station_1_minutes, 12, 'the local edit was lost');
});

test('Reload discards the edits and takes the schedule from Home Assistant', () => {
  const { card, hass } = makeCard(window, { schedule: juneSchedule() });
  const input = shadow(card).querySelector("[data-role='station-minutes']");
  input.value = '12';
  fire(window, input, 'input');

  const changed = juneSchedule();
  changed[5].interval_days = 9;
  hass.states['sensor.solem_controller_status'].attributes.schedule = changed;
  card.hass = hass;

  shadow(card).querySelector("[data-action='reload-schedule']").click();

  assert.equal(card.scheduleData[5].stations.station_1_minutes, 10);
  assert.equal(card.scheduleData[5].interval_days, 9);
  assert.equal(externalNotice(card).hidden, true);
  assert.equal(badge(card).hidden, true);
});

test('an outside change while a field has focus is announced without stealing it', () => {
  const { card, hass } = makeCard(window, { schedule: juneSchedule() });
  const input = shadow(card).querySelector("[data-role='station-minutes']");
  input.focus();
  input.value = '12';
  fire(window, input, 'input');

  const changed = juneSchedule();
  changed[5].interval_days = 9;
  hass.states['sensor.solem_controller_status'].attributes.schedule = changed;
  card.hass = hass;

  assert.equal(externalNotice(card).hidden, false);
  assert.equal(shadow(card).activeElement, input);
});

test('no outside-change notice when only the schedule we already hold comes back', () => {
  const { card, hass } = makeCard(window, { schedule: juneSchedule() });
  const input = shadow(card).querySelector("[data-role='station-minutes']");
  input.value = '12';
  fire(window, input, 'input');

  // The same schedule, with something else on the entity changed.
  hass.states['sensor.solem_controller_status'].attributes.friendly_name = 'Renamed';
  card.hass = hass;

  assert.equal(externalNotice(card).hidden, true);
});
// The rows used to be the keys stored for the month. A month with nothing
// stored showed no station at all, so it could never be configured here.
// The integration publishes num_stations and station_names on the sensor.

const stationRows = card => [...shadow(card).querySelectorAll("[data-role='station-minutes']")];
const stationLabels = card =>
  [...shadow(card).querySelectorAll('.station-label')].map(node => node.textContent.trim());

test('an empty month still offers one row per station of the controller', () => {
  const { card } = makeCard(window, {
    schedule: emptyMonths(),
    num_stations: 2,
    station_names: ['ZEN', 'BBQ']
  });

  assert.deepEqual(stationRows(card).map(input => input.dataset.stationKey), [
    'station_1_minutes',
    'station_2_minutes'
  ]);
  assert.deepEqual(stationRows(card).map(input => input.value), ['0', '0']);
  assert.deepEqual(stationLabels(card), ['ZEN', 'BBQ']);
});

test('without station names the rows get generic labels', () => {
  const { card } = makeCard(window, { schedule: emptyMonths(), num_stations: 2 });

  assert.deepEqual(stationLabels(card), ['Station 1', 'Station 2']);
});

test('the station count falls back to the names, then to the stored schedule', () => {
  const byNames = makeCard(window, { schedule: emptyMonths(), station_names: ['A', 'B', 'C'] });
  assert.equal(stationRows(byNames.card).length, 3);

  const byStored = makeCard(window, { schedule: juneSchedule() });
  assert.equal(stationRows(byStored.card).length, 2);
});

test('typing minutes into a row that was never stored saves that station', async () => {
  const { card, hass } = makeCard(window, {
    schedule: emptyMonths(),
    num_stations: 2,
    station_names: ['ZEN', 'BBQ']
  });

  const second = stationRows(card)[1];
  second.value = '7';
  fire(window, second, 'input');
  await card._saveSchedule();

  assert.deepEqual(plain(hass.calls[0].data.schedule[5].stations), { station_2_minutes: 7 });
});

test('a stored station beyond the reported count is still shown', () => {
  const months = juneSchedule();
  months[5].stations.station_3_minutes = 4;
  const { card } = makeCard(window, { schedule: months, num_stations: 2 });

  assert.deepEqual(stationRows(card).map(input => input.dataset.stationKey), [
    'station_1_minutes',
    'station_2_minutes',
    'station_3_minutes'
  ]);
});

test('with no station known anywhere the card says so instead of showing nothing', () => {
  const { card } = makeCard(window, { schedule: emptyMonths() });

  assert.equal(stationRows(card).length, 0);
  assert.match(shadow(card).querySelector('.empty-hint').textContent, /No stations/);
});

test('the card redraws when the number of stations changes', () => {
  const { card, hass } = makeCard(window, { schedule: emptyMonths(), num_stations: 2 });
  assert.equal(stationRows(card).length, 2);

  hass.states['sensor.solem_controller_status'].attributes.num_stations = 3;
  card.hass = hass;

  assert.equal(stationRows(card).length, 3);
});
// The integration keeps duplicate times and counts each one as a watering slot
// of its own, so two identical times double the daily target. The card said
// nothing. It warns; it does not change the schedule behind the user's back.

const duplicateNotice = card => shadow(card).querySelector("[data-role='duplicate-notice']");

test('duplicate times are flagged and the schedule is left as it is', async () => {
  const months = juneSchedule();
  months[5].hours = ['21:00:00', '07:00:00', '07:00:00'];
  const { card, hass } = makeCard(window, { schedule: months });

  assert.equal(duplicateNotice(card).hidden, false);
  assert.match(duplicateNotice(card).textContent, /07:00:00/);
  assert.match(duplicateNotice(card).textContent, /count twice/);

  // Not sorted, not merged: what is stored is what is saved.
  assert.deepEqual(plain(card.scheduleData[5].hours), ['21:00:00', '07:00:00', '07:00:00']);
  await card._saveSchedule();
  assert.deepEqual(plain(hass.calls[0].data.schedule[5].hours), ['21:00:00', '07:00:00', '07:00:00']);
});

test('no warning when every time is different', () => {
  const { card } = makeCard(window, { schedule: juneSchedule() });

  assert.equal(duplicateNotice(card).hidden, true);
});

test('typing a time that already exists raises the warning without redrawing the field', () => {
  const { card } = makeCard(window, { schedule: juneSchedule() });
  const second = shadow(card).querySelectorAll("[data-role='time-slot']")[1];
  second.focus();

  second.value = '07:00';
  fire(window, second, 'input');

  assert.equal(duplicateNotice(card).hidden, false);
  assert.equal(shadow(card).activeElement, second);

  second.value = '08:00';
  fire(window, second, 'input');
  assert.equal(duplicateNotice(card).hidden, true);
});

test('07:00 and 07:00:00 are the same time', () => {
  const months = juneSchedule();
  months[5].hours = ['07:00', '07:00:00'];
  const { card } = makeCard(window, { schedule: months });

  assert.equal(duplicateNotice(card).hidden, false);
});

test('adding and removing a time updates the warning', () => {
  const { card } = makeCard(window, { schedule: juneSchedule() });

  // A new time starts at 07:00:00, which June already has.
  shadow(card).querySelector("[data-action='add-time']").click();
  assert.equal(duplicateNotice(card).hidden, false);

  shadow(card).querySelectorAll("[data-action='remove-time']")[2].click();
  assert.equal(duplicateNotice(card).hidden, true);
});