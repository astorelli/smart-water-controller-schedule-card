# v2.0.0-beta.1 — Unified Smart Water Controller Cards

## Included

- Schedule editor retained, including monthly configuration and real Save action
- Overview and Weather cards, including expandable detail
- Expandable Zones, manual duration, Start/Stop, Stop All, countdown and related sensors
- Disable zone controls when any configured RainBird switch is unavailable or unknown
- Harmonized styling across all three card types
- Fix desktop clicks previously lost to unrelated Home Assistant state updates

## Verified in Home Assistant

The prerelease was downloaded through HACS. The `Utilities / irri` dashboard successfully loaded the three cards after old standalone JavaScript Resource entries were removed. Schedule changes synchronized between the older and unified Schedule Card in both directions; watering controls and mobile interactions were tested; desktop button clicks worked consistently after the rerender fix.

## Upgrade

The HACS resource is still `smart-water-controller-schedule-card.js`. All three existing card type names are preserved. Remove old `/local/` Overview, Zones and Schedule styling Resource entries, as well as the `-dev` test resource, after installation. Retain backups until satisfied.

## Rollback

Use HACS **Redownload** to select a previous release and reload the frontend. If that release contains only the Schedule Card, restore the separate Overview and Zones scripts as needed.

## Release status

This file documents the successful beta test. The stable `v2.0.0` release should be created **after** merging the development Pull Request into `main`.
