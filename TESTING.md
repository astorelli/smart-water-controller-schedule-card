# Testing and release verification

## Side-by-side testing from a development branch

The branch includes `smart-water-controller-cards-test.js` (and an Android-friendly `.txt` copy). It registers **different** custom-element names so it can coexist with HACS:

- `custom:irrigation-summary-card-dev`
- `custom:irrigation-zones-card-dev`
- `custom:smart-water-controller-schedule-card-dev`

1. Place the test JavaScript in `/config/www/`.
2. Register `/local/smart-water-controller-cards-test.js?v=2` as a JavaScript module.
3. Duplicate the existing irrigation view and change only the three card types above.
4. Keep the original sensor and entity configurations; test both views.

Saving the test Schedule Card **does modify the real schedule**, just as the production card does.

## Validation completed for v2.0.0-beta.1

- Schedule edits saved in the new card appeared in the original card.
- Schedule edits saved in the original card appeared in the new card.
- Irrigation was started and the zone cards reacted as expected.
- Android/mobile card interaction worked.
- A desktop repeated-click issue was diagnosed as excess rerendering on unrelated Home Assistant updates; a revised bundle resolved the observed problem.
- Beta downloaded via HACS.
- The existing `Utilities / irri` view worked with just the unified HACS resource; redundant standalone JavaScript resource entries were removed.

## Release workflow

1. Work in `feature/unified-water-controller-cards`.
2. Run `node scripts/build.js`, commit the generated `smart-water-controller-schedule-card.js`, and check that source and bundle are in sync.
3. Test a prerelease by creating a GitHub Release tag targeting the development branch, marking it as a prerelease.
4. Test the version in HACS on a real Home Assistant instance and check Dashboard Resources for duplicate registrations.
5. Review the PR, merge to `main`, and create the stable `v2.0.0` release targeting `main`.
6. Verify HACS offers the stable release and the existing YAML still works.

The `-dev` bundle is for development only; it is not the distributable HACS file.
