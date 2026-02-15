Original prompt: [$develop-web-game](/Users/m/.codex/skills/develop-web-game/SKILL.md)this game has gone sideways. redsign it from scratch.

## 2026-02-15
- Assumption: "this game" refers to `fruit-stacker`, the only fully playable game wired in current app shell.
- Read current implementation in:
  - `src/games/fruit-stacker/game.ts`
  - `src/games/fruit-stacker/main.ts`
  - `src/games/fruit-stacker/styles.css`
  - `games/fruit-stacker/index.html`
- Observed old loop is non-deterministic for automation (`window.advanceTime`/`window.render_game_to_text` missing).
- Next: rebuild `game.ts` from scratch with deterministic fixed-step simulation, same merge chain, and sustained overflow game-over behavior.
- Rewrote `src/games/fruit-stacker/game.ts` from scratch:
  - deterministic fixed-step simulation loop
  - preserved canonical merge order from `FRUIT_TIERS`; pumpkin terminal enforced
  - sustained overflow game-over (`overflowFrames`) retained
  - added testing hooks: `window.advanceTime(ms)` and `window.render_game_to_text()`
  - added fullscreen toggle via `f` and exit support via `Escape`
  - preserved integration API used by `main.ts` (`setMuted`, `getMuted`, `reset`)
- Next: run `npm run typecheck`, run Playwright client loop, inspect screenshots/state/errors, then iterate.
- Validation run:
  - `npm run typecheck` passed.
  - Ran Playwright client loops (via symlinked `$WEB_GAME_CLIENT` + `--preserve-symlinks-main` for module resolution) against `http://127.0.0.1:5173/games/fruit-stacker/`.
  - Executed keyboard and pointer action bursts; inspected screenshots + `state-*.json` output.
  - No `errors-*.json` files produced (no captured console/page errors).
  - Confirmed merges produce higher tiers (observed progression up through `peach` in stress runs) and score increments.
  - Confirmed `render_game_to_text` reflects live state (mode, launcher, fruits, score, overflow counters).
  - `npm run test` passed (20 tests).
- Notes/TODO for next agent:
  - Full automated reach of terminal `pumpkin` and explicit sustained-overflow game-over scenario was not achieved in current scripted bursts due broad spreading stacks; logic path exists and should be stress-tested further if needed.
  - If deeper deterministic scenario tests are required, add targeted e2e harness assertions for merge-chain milestones and forced-overflow setup.
- Final follow-up:
  - Added fullscreen board sizing styles in `src/games/fruit-stacker/styles.css` (`:fullscreen` / `:-webkit-full-screen`) so `f` toggle expands the play area.
  - Re-ran Playwright client quick regression (`output/web-game/fruit-stacker-redesign-final`) and rechecked screenshot/state output.
  - Re-ran `npm run typecheck` and `npm run test`; both passed.

## 2026-02-15 (HD + realism pass)
- User request: make fruits less pixelated and make fall direction feel more realistic.
- Changes made:
  - Switched canvas CSS rendering from `image-rendering: pixelated` to `image-rendering: auto` in `src/games/fruit-stacker/styles.css`.
  - Enabled high-quality canvas smoothing in `src/games/fruit-stacker/game.ts` (`imageSmoothingEnabled` + `imageSmoothingQuality = "high"`).
  - Added subtle per-fruit lateral air drift (`driftAmplitude` + `driftPhase`) and applied drift only while airborne to avoid jitter when settled.
  - Extended `render_game_to_text` fruit payload with `drift` value for test visibility.
- Next: run typecheck + Playwright screenshot/state validation and confirm no regressions.
- Validation:
  - `npm run typecheck` passed.
  - Ran Playwright drift/smoothing capture loops:
    - `output/web-game/fruit-stacker-hd-drift-pass1`
    - `output/web-game/fruit-stacker-hd-drift-pass2` (after drift tuning)
  - Inspected screenshots and `state-*.json`; saw per-fruit drift values and varied horizontal trajectories in-flight.
  - No `errors-*.json` emitted (no captured console/page errors).
  - `npm run test` passed (20 tests).

## 2026-02-15 (policy rewrite + PNG runtime switch)
- User request: rewrite rules to allow higher fruit versions and implement change.
- Rule updates:
  - `AGENTS.md`: Fruit Stacker sprite policy now allows local PNG runtime sprites; SVG fallback remains required in config.
  - `docs/asset-style-families.md`: fruit family constraints now allow SVG or high-resolution PNG runtime assets.
- Runtime asset implementation:
  - Copied HD fruit PNG set from `output/imagegen/fruit-stacker-hd/final/*-hd.png` into `public/assets/fruits/<fruit>.png`.
  - Updated `src/games/fruit-stacker/config.ts` `spriteUrl` values to `/assets/fruits/*.png` while keeping `fallbackSpriteUrl` as SVG.
  - Restored sprite fallback loading in `src/games/fruit-stacker/game.ts` (`sprite.onerror` swaps to `fallbackSpriteUrl`).
  - Added PNG catalog entries to `content/assets/pixel-art.json` with `fruit-stacker-fruits-v2` metadata.
  - Updated `tests/unit/pixelAssetCatalog.test.ts` to validate both `.svg` and `.png` runtime image assets.
- Next: run typecheck/tests + Playwright validation and inspect screenshots/state/errors.
- Validation:
  - `npm run typecheck` passed.
  - `npm run test` passed (20 tests).
  - Ran Playwright capture: `output/web-game/fruit-stacker-png-pass1`.
  - Reviewed screenshots + `state-*.json`; PNG fruit sprites render in gameplay/preview and drift/state outputs remain correct.
  - No `errors-*.json` emitted (no captured console/page errors).

## 2026-02-15 (halo cleanup pass)
- User feedback: odd shade/halo around fruits.
- Cleanup implemented:
  - Replaced runtime PNGs for `apple, kiwi, lemon, melon, orange, peach, pear, watermelon` with lower-halo source variants from `output/imagegen/fruit-stacker-hd/raw/`.
  - Kept `cherry` and `pumpkin` on previous `final` variants (raw variants were visually worse for halo artifacts).
  - Updated corresponding `content/assets/pixel-art.json` `sourceAssetId` / `sourceUrl` metadata for raw-sourced entries.
- Next: rerun typecheck/tests + Playwright visual check for halo reduction.
- Validation:
  - `npm run typecheck` passed.
  - `npm run test` passed (20 tests).
  - Ran Playwright capture: `output/web-game/fruit-stacker-halo-cleanup-pass1`.
  - Reviewed screenshots + `state-*.json`; no `errors-*.json` emitted.

## 2026-02-15 (naturalness correction pass)
- User feedback: halo still present (especially small fruits) and overall look felt unnatural.
- Implemented correction:
  - Switched Fruit Stacker `spriteUrl` runtime paths back to `/assets/fruits/*.svg` for full family consistency and to remove PNG alpha-fringe artifacts.
  - Kept policy support for PNGs, but stopped using current generated PNG set at runtime.
  - Replaced sinusoidal lateral drift with a simple one-direction decaying air-drift model (`airDrift`) to keep trajectories varied without artificial oscillation.
- Next: rerun typecheck/tests + Playwright visual validation.
- Validation:
  - `npm run typecheck` passed.
  - `npm run test` passed (20 tests).
  - Ran Playwright capture: `output/web-game/fruit-stacker-naturalness-pass1`.
  - Reviewed screenshots + `state-*.json`; visuals are back to consistent outlined family style and no PNG halo fringe observed.
  - No `errors-*.json` emitted.
