# Test the unified cards without replacing HACS

The existing HACS installation on main remains unchanged. This development bundle registers *different* card names, so it can coexist with production resources.

## Download
Download `smart-water-controller-cards-test.js` from this branch's GitHub **Raw** link, then copy to `/config/www/smart-water-controller-cards-test.js`.

Add one dashboard resource:
`/local/smart-water-controller-cards-test.js?v=1` (JavaScript module).

**Do not replace the existing HACS resource and do not remove the existing /local/ irrigation scripts while testing.**

## Test dashboard (duplicate view, do not replace working view)
Make a copy of the `Utilities / irri` view and change the card types only:
- `custom:irrigation-summary-card` -> `custom:irrigation-summary-card-dev` (for both overview and weather)
- `custom:irrigation-zones-card` -> `custom:irrigation-zones-card-dev`
- `custom:smart-water-controller-schedule-card` -> `custom:smart-water-controller-schedule-card-dev`

Keep all entities, schedule sensor and other YAML unchanged.

## Verify
1. All three card types render; Overview and Weather expand correctly.
2. Zone start/stop controls obey connection switch availability.
3. Manual minutes update and sync.
4. Schedule month navigation, intervals, add/remove time and station minutes work.
5. Only after reviewing edits, press Save and verify persisted schedule through the original card.

This is a development build, not a GitHub Release or HACS-installable prerelease. It is intentionally served from /local to keep HACS stable.

## Build
Run `node scripts/build.js` for production build in an isolated checkout.
The test bundle uses -dev tag names specifically to avoid duplicate custom-element registration.
