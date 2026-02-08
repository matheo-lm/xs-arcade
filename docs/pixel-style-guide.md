# Pixel Style Guide

Use this checklist for UI work.

## Required
- Keep clear readability and contrast for ages 4-8.
- Use shared tokens from `src/shared/ui/base.css`.
- Use shared game header from `src/shared/ui/gameHeader.ts` + `src/shared/ui/gameHeader.css` for all game pages.
- Keep controls >= 44x44.
- Use local-only SVG image assets from `public/assets/` (no remote runtime URLs).
- Register every image in `content/assets/pixel-art.json`.
- Enforce consistency by family:
  - all assets in a family use one visual profile
  - different families can use different profiles

## Family Examples
- `fruit-stacker-fruits-v2`: outlined playful fruit sprite set tuned for Fruit Stacker readability.
- `launcher-card-icons-v2`: custom in-house launcher game card icon set.

## Typography
- Pixel font: headings, controls, labels, pills, tags.
- Body font: long descriptions, hint copy, helper text.

## Surfaces
- Panels: framed, beveled, high-contrast edges.
- Buttons: clear pressed/disabled states.
- Avoid noisy effects that reduce legibility.

## Effects
- Allowed: subtle glow, scanlines, pixel-grid texture.
- Avoid heavy blur or motion noise.

## Launcher Menu
- Hamburger popover only.
- Closed by default.
- Toggle open/close with button.
- Close on outside click and Escape.

## QA Quick Check
- Launcher and game pages look like one product.
- Shared header appears and aligns consistently.
- Theme switch keeps readable identity in both modes.
- Fruit sprites are visually consistent across all tiers.
- Game cards are visually recognizable by scene/object, not by initials alone.
