# Design Principles

## Visual Direction
- Family-level consistency is required.
- Brand direction favors playful arcade visuals with strong readability.
- Pixel style is valid and encouraged for game-style families, but not mandatory for every family.

## Family Consistency System
- Define a `familyId` and `styleProfile` for every image asset.
- Keep each family visually consistent.
- Allow different families to use different visual systems when intentional.

## Typography and Layout
- `--font-pixel` for headings, controls, labels, pills, and tags.
- `--font-body` for descriptions and longer copy.
- Prefer framed panels and compact, touch-friendly controls.

## Theme Rules
- Support both `data-theme="light"` and `data-theme="dark"`.
- Maintain readable contrast in both modes.

## Interaction Rules
- Mobile-first touch interactions.
- Minimum 44x44 px actionable targets.
- One primary call-to-action per panel/screen.
- Launcher settings menu is a popover hamburger: closed by default, toggled by button, closable via outside click and Escape.

## Game Header Standard
- Every game route must use shared game header chrome from:
  - `src/shared/ui/gameHeader.ts`
  - `src/shared/ui/gameHeader.css`
- Required zones:
  - back link
  - localized game title
  - meta pill row (score/status as needed)
  - right action row (sound/restart/etc. as needed)

## Accessibility Baseline
- Semantic labels for controls.
- Visible keyboard focus behavior.
- Avoid conveying state with color alone.

## Sound and Feedback
- Global mute is always available.
- sound effects support actions and outcomes, but game remains playable muted.
