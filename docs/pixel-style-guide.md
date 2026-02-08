# Pixel Style Guide

Use this checklist for UI work.

## Required
- Keep 90s pixel-arcade visual direction.
- Use shared tokens from `src/shared/ui/base.css`.
- Use shared game header from `src/shared/ui/gameHeader.ts` + `src/shared/ui/gameHeader.css` for all game pages.
- Keep controls >= 44x44.
- Keep both dark/light themes pixel consistent.

## Typography
- Pixel font: headings, controls, labels, pills, tags.
- Body font: long descriptions, hint copy, helper text.

## Surfaces
- Panels: framed, beveled, high-contrast edges.
- Buttons: pixel gradient, clear pressed/disabled states.
- Avoid modern rounded/glass styles.

## Effects
- Allowed: subtle glow, scanlines, pixel-grid texture.
- Avoid heavy blur or motion noise.

## Launcher Menu
- Hamburger popover only.
- Closed by default.
- Toggle open/close with button.
- Close on outside click and Escape.

## QA Quick Check
- Launcher and game pages look like one visual system.
- Shared header appears and aligns consistently.
- Theme switch keeps style identity in both modes.
