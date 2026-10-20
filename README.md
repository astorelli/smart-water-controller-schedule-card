# Smart Water Controller Cards

Three Home Assistant dashboard cards bundled in **one HACS JavaScript resource**:

- **Overview / Weather** — `custom:irrigation-summary-card` with `mode: overview` or `mode: weather`
- **Zones** — `custom:irrigation-zones-card`, expandable irrigation zones, manual duration, Start/Stop and connection-aware disabling
- **Schedule** — `custom:smart-water-controller-schedule-card`, preserving the original schedule editor and Save action

The original Schedule Card type and the existing Overview and Zones types are retained for compatibility. All three share the same visual styling. The source code is modular under `src/`, and the distributed bundle remains `smart-water-controller-schedule-card.js`.

## Installation

Install or update this repository as a HACS dashboard frontend repository **only after a release is published**. HACS installs the root `smart-water-controller-schedule-card.js` file. Do not register duplicate /local resources containing the same card definitions.

For side-by-side testing of the development branch without changing the stable HACS installation, follow [TESTING.md](TESTING.md). The `-dev` card tags are intentionally different.

## Examples

Overview:
```yaml
type: custom:irrigation-summary-card
mode: overview
```

Weather:
```yaml
type: custom:irrigation-summary-card
mode: weather
```

Zones:
```yaml
type: custom:irrigation-zones-card
duration: number.rainbird_irrigation_manual_duration
end_time: sensor.rainbird_irrigation_end_time
stop: button.rainbird_stop_sprinkle
show_global_stop: true
connection_switches:
  - switch.rain_bird_sprinkler_1
  - switch.rain_bird_sprinkler_2
  - switch.rain_bird_sprinkler_3
zones:
  - name: Front Lawn 1
    status: sensor.rainbird_front_lawn_status_1
    today: sensor.rainbird_sprinkle_total_amount_today_front_lawn
    planned: sensor.rainbird_forecasted_sprinkle_today_front_lawn
    remaining: sensor.rainbird_remaining_sprinkle_today_front_lawn
    start: button.rainbird_sprinkle_front_lawn_1
    valve: switch.rain_bird_sprinkler_1
```
Add the other zones using their corresponding status, today, planned, remaining, start, and valve entities.

Schedule:
```yaml
type: custom:smart-water-controller-schedule-card
sensor: sensor.rainbird_controller_status
header: false
```

## Schedule functionality

The Schedule Card supports month selection, interval days, scheduled times, station-specific durations and saving to the Smart Water Controller integration. Saving changes the *real* controller schedule.

## Build and development

Run `node scripts/build.js` from the repository root. The build checks source syntax, assembles the single resource and checks the resulting JavaScript.

See [TESTING.md](TESTING.md) for isolated testing before publishing. This branch is pre-release work; **do not merge to main until the HACS package installation is tested**.

## Upgrade from standalone scripts

After installing and verifying a released unified HACS bundle, remove only the redundant `/local/irrigation-summary-card.js`, `/local/irrigation-zones-card.js`, and `/local/irrigation-schedule-style.js` entries from Dashboard Resources. Keep one bundled resource and your existing card YAML. Do not delete the local files until you have confirmed a clean reload.

## Compatibility

Home Assistant frontend versions must support JavaScript custom elements and CSS `color-mix()`. The existing entity IDs are supplied in YAML and can be adapted to other Smart Water Controller installations.
