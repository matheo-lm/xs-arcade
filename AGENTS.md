# AGENTS.md

## Product Direction
This repository is evolving from a single game into a kid-friendly web arcade platform.
- Current game: Fruit Stacker Arcade.
- Target: multiple lightweight arcade games under one deployable web app.
- Primary deployment target: Vercel, usable on desktop and mobile browsers.

## Architecture (Current)
- `/Users/m/Desktop/berries/index.html`: entry page for the current game.
- `/Users/m/Desktop/berries/css/styles.css`: shared visual style for current UI.
- `/Users/m/Desktop/berries/js/game.js`: Fruit Stacker gameplay, rendering, and controls.

## Architecture (Next)
When adding game #2+, migrate toward:
- `/Users/m/Desktop/berries/games/<game-slug>/index.html`
- `/Users/m/Desktop/berries/games/<game-slug>/css/styles.css`
- `/Users/m/Desktop/berries/games/<game-slug>/js/game.js`
- `/Users/m/Desktop/berries/shared/` for reusable UI, audio, storage, and utilities.

## Visual Direction
- Keep a retro arcade style inspired by 90s/16-bit aesthetics.
- Use pixel-like typography and high-contrast UI.
- Favor clear readable game objects over realism.
- Preserve mobile-friendly layout and touch interactions.

## Asset Policy
- External asset CDNs are allowed for lightweight image sprites/fonts.
- Every external asset should have a graceful fallback path when loading fails.
- Prefer stable, version-pinned URLs for external assets.

## Gameplay Rules (Fruit Stacker)
- Core merge rule: same-type fruit touching merges into the next tier.
- Merge chain must include: Cherry -> Lemon -> Orange -> Apple -> Pear -> Peach -> Melon -> Watermelon.
- Watermelon is the terminal tier and should not merge further.
- Game over should trigger only when top-line overflow is sustained.

## AI Collaboration Rules
- Read relevant files before editing and preserve intentional behavior.
- Make focused, incremental edits and validate each step.
- Do not add heavy dependencies or build tooling unless requested.
- Keep naming and file organization consistent with this document.
- If assumptions are needed, state them in the final summary.

## Validation Checklist (Every Change)
1. Syntax check:
   - `node --check /Users/m/Desktop/berries/js/game.js`
2. Verify entry wiring:
   - CSS and JS references in `/Users/m/Desktop/berries/index.html`
3. Manual smoke test in browser:
   - Drop fruit via mouse and touch.
   - Confirm mouse/touch/arrow aiming changes the drop lane.
   - Merge through Peach -> Melon -> Watermelon.
   - Restart flow and game-over flow.

## Near-Term Roadmap
- Add `/Users/m/Desktop/berries/README.md` and keep it current.
- Add a simple game launcher shell for multiple games.
- Add local high-score persistence per game.
- Add optional sound with a global mute toggle.
