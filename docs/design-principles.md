# Design Principles

## Visual Direction
- Retro pixel (16-bit clean) look is the default brand style.
- Keep strong contrast with readable body text.
- Blend old-school arcade cues with modern, clean composition for current screens.
- Use pixel frames, beveled panels, and restrained glow/scanline accents.

## Pixel Arcade System
- Typography split:
  - `--font-pixel` for headings, controls, labels, pills, and tags.
  - `--font-body` for descriptions and longer copy.
- Shapes and borders:
  - Prefer 3px framed panels and 2px framed controls.
  - Prefer small-radius corners (`3px` to `4px`) over rounded modern cards.
- Effects:
  - Allowed: restrained glow, scanlines, pixel-grid textures.
  - Avoid heavy blur, glassmorphism, or flat minimal cards.

## Theme Rules
- Support both `data-theme="light"` and `data-theme="dark"`.
- Keep both themes pixel-styled, not modernized variants.
- Preserve readable contrast in both modes.

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

## Typography and Copy
- Short labels suitable for early readers.
- Visual cues (icons, pills, tags) used before long text.
- Layout supports longer Spanish strings without clipping.

## Accessibility Baseline
- Semantic labels for controls.
- Visible keyboard focus behavior.
- Avoid conveying state with color alone.

## Sound and Feedback
- Global mute is always available.
- sound effects support actions and outcomes, but game remains playable muted.
