# Unified frontend architecture

One HACS repository and one distributed JavaScript file provide all three Smart Water Controller dashboard card types.

## Source layout

- `src/schedule-card.js`: original Schedule Card logic and Smart Water Controller integration service calls
- `src/schedule-style.js`: shared visual treatment applied to the Schedule Card
- `src/overview-card.js`: Overview and Weather modes
- `src/zones-card.js`: expandable zone view and controls
- `scripts/build.js`: concatenates source modules and validates syntax
- `smart-water-controller-schedule-card.js`: generated **production** HACS resource
- `smart-water-controller-cards-test.js`: independent development resource with `-dev` custom-element names

The root filename remains unchanged for HACS compatibility. The current visual style is harmonized; an eventual shared CSS source may replace duplicated per-card definitions.

## Compatibility and behavior

Original card element names remain stable:
- `smart-water-controller-schedule-card`
- `irrigation-summary-card`
- `irrigation-zones-card`

Overview/Weather is one class with two modes. Zones collapse independently of the schedule editor. The Zones availability guard checks the configured integration switches for `unknown`/`unavailable`, while the Overview banner can separately use a RainBird-specific input_boolean.

A previous browser issue arose because the custom card rebuilt its entire DOM on every Home Assistant `hass` update. The cards now compare relevant entity references and update only when those entities change; countdown text can update without replacing buttons.

## Build and verification

Run `node scripts/build.js` and commit the resulting production bundle before publishing. Inspect [TESTING.md](TESTING.md) for validation history and release steps.

When installed through HACS, register **only** its single bundled JavaScript resource. The old standalone `/local/` resource entries cause duplicate element registrations and must be removed during migration.
