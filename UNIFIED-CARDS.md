# Unified Smart Water Controller Cards — development branch

This branch is an **in-progress** migration. The published HACS resource on `main` remains unchanged.

## Target
A single HACS resource, built from:
- `src/schedule-card.js`: original schedule editor logic (preserved)
- `src/overview-card.js`: overview + weather
- `src/zones-card.js`: expandable zones + start/stop controls

The build output retains the original HACS filename `smart-water-controller-schedule-card.js`.
Use `node scripts/build.js` to regenerate it once all three sources are present.

### Compatibility
Existing `custom:smart-water-controller-schedule-card` configurations continue to work.
New elements will retain `custom:irrigation-summary-card` and `custom:irrigation-zones-card` during transition; aliases can be added in a subsequent release.

### Safety
Do not merge or release until the original schedule editing, save service, zone controls and connection-loss handling are tested in Home Assistant. Do not register separate `/local/` resources after migration, or duplicate custom-element registration may occur.
