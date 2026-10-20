# v2.0.0-beta.1 — Unified Smart Water Controller Cards

**Pre-release for testing.** Create the GitHub release with tag `v2.0.0-beta.1` targeting `feature/unified-water-controller-cards`, not main.

## Included
- Existing schedule editor, original card tag and original save service
- Overview and Weather cards, expandable detailed weather values
- Expandable Zone card, duration controls, Start/Stop, global Stop, countdown
- Disable zone commands when any configured RainBird switch is unavailable or unknown
- Visual alignment across all three cards
- Fix desktop clicks lost to unrelated Home Assistant state updates

## Compatibility
Existing `custom:smart-water-controller-schedule-card`, `custom:irrigation-summary-card`, and `custom:irrigation-zones-card` YAML remains unchanged. Install only one bundled JS resource after migrating from /local resources.

## Verification
Side-by-side tests confirmed schedule edits synchronize and zone control behavior. Desktop intermittent click issue was fixed and retested. HACS pre-release installation and resource migration are not yet verified.

## Rollback
Keep the stable installation until beta verification completes. Remove beta resource and restore old HACS resource/local JavaScript entries if needed.
