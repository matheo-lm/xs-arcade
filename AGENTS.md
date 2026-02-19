# AGENTS.md

## Product Direction
Berries Arcade is a web arcade platform for kids ages 4-8 with multiple short games under one deployable app.

- Deployment target: Vercel.
- Runtime target: desktop + mobile browsers.
- Privacy baseline: no third-party analytics.
- Data model: local-only profiles, stars, badges, and settings.
- Launch locales: English (`en`) and Spanish (`es`).

## Architecture Rules
- Launcher entry: `/Users/m/Desktop/berries/index.html`.
- Game pages: `/Users/m/Desktop/berries/games/<game-slug>/index.html`.
- Shared platform code: `/Users/m/Desktop/berries/src/shared/`.
- Launcher/app shell code: `/Users/m/Desktop/berries/src/platform/`.
- Game metadata manifests: `/Users/m/Desktop/berries/content/games/*.json`.
- Public static assets/locales: `/Users/m/Desktop/berries/public/`.

When adding a game, keep the slug consistent across:
- `games/<slug>/index.html`
- `content/games/<slug>.json`
- registry references

## Required Manifest Fields
Each file in `/Users/m/Desktop/berries/content/games/*.json` must include:
- `id`
- `slug`
- `path`
- `status` (`playable` or `placeholder`)
- `title.en`, `title.es`
- `description.en`, `description.es`
- `cardIcon`
- `ageBands`
- `skills`
- `learningGoals`
- `difficultyPresets.4-5`
- `difficultyPresets.6-7`
- `difficultyPresets.8`

## Fruit Stacker Gameplay Contract
Canonical merge chain must remain:

`Cherry -> Lemon -> Kiwi -> Orange -> Apple -> Pear -> Peach -> Melon -> Watermelon -> Pumpkin`

Rules:
- Pumpkin is terminal.
- Same-type touching merges into next tier.
- Game over triggers immediately when an eligible stacked fruit crosses above the top line.
- Newly dropped fruits are exempt from top-line loss for a short spawn window.
- Touching pumpkins trigger a win celebration while pumpkin remains terminal.

## Asset Policy
- Runtime image assets must be local-only under `/Users/m/Desktop/berries/public/assets/` (no CDN or remote runtime image URLs).
- Every image used by platform or games must have a catalog record in `/Users/m/Desktop/berries/content/assets/pixel-art.json`.
- Use SVG assets for launcher and shared UI image delivery.
- Fruit Stacker gameplay sprites may use local high-resolution PNGs under `/Users/m/Desktop/berries/public/assets/fruits/` with SVG fallback paths retained in config.
- Consistency is enforced per asset family, not globally across every image.
- Families may use different visual systems, but each family must remain internally consistent.
- Do not add heavyweight asset pipelines unless requested.

## Image Family Policy (Required)
- `content/games/*.json` `cardIcon` values must be local `/assets/...svg` paths.
- Fruit Stacker `spriteUrl` values may be local `/assets/fruits/*.png` or `/assets/fruits/*.svg` paths.
- Fruit Stacker `fallbackSpriteUrl` values must be local `/assets/fruits/*.svg` paths.
- Family-level consistency contracts:
  - `fruit-stacker-fruits-v2`: all 10 fruit tiers share the same outlined playful style profile.
  - `launcher-card-icons-v2`: all launcher game card icons share one custom in-house style profile.
- New image files require:
  - placement in `/Users/m/Desktop/berries/public/assets/` (appropriate subfolder)
  - matching entry in `/Users/m/Desktop/berries/content/assets/pixel-art.json`
  - required catalog metadata: `familyId`, `styleProfile`, `sourceLibrary`, `sourceAssetId`, `sourceLicense`, `sourceUrl`, `normalized`
- Third-party sourced images must be listed in `/Users/m/Desktop/berries/content/assets/THIRD_PARTY_ASSETS.md`.
- Visual spec references for active families live in `/Users/m/Desktop/berries/docs/asset-style-families.md`.

## Localization Policy
- All user-facing shared UI copy must be present in both `en` and `es`.
- New translation keys require updates in:
  - `/Users/m/Desktop/berries/src/shared/i18n/dictionaries.ts`
  - `/Users/m/Desktop/berries/public/locales/en/common.json`
  - `/Users/m/Desktop/berries/public/locales/es/common.json`

## Cross-Game UI Consistency
Every game page must look and feel like part of the same arcade. Follow these rules:

### Shared Shell
- Use `<main class="app-shell game-shell">` as the outer wrapper.
- `.game-shell` provides a centred column capped at **1000 px** (defined in `base.css`).
- Mount the header in `<div id="gameHeaderMount"></div>` (first child).

### Game Header
- Always render via `renderGameHeader` from `@shared/ui/gameHeader`.
- Keep it clean: Only Home, Title, Score/Status, and Settings Menu.
- No clutter: Move "Sound", "Restart", and "Immersive/Fullscreen" into the **Settings Menu**.
- No nested boxes: Avoid `.panel` borders on the header. Use `border-bottom` instead.
- Score meta pill is required; high-score pill is optional.

### Hint / Instructions
- Use the shared `.hint` class for the instruction paragraph.
- Place it as the last child of the game shell, after any controls.

### Game-Over / Win Overlay
- Use the shared `.overlay` class (positioned inside the board `<section>`).
- Toggle visibility with `.visible` (`classList.add/remove("visible")`).
- Inner `<div>` gets automatic panel styling.

### Touch Targets & Mobile
- All interactive elements must be at least **44 × 44 px** tap targets.
- Test every game at **375 px width** (iPhone SE) — no horizontal scroll allowed.
- Header must stay single-row; title hides on narrow screens automatically via `gameHeader.css`.

### Responsive Convention
- Game boards should declare a max-width (via `width: min(100%, <px>)`).
- Controls and hint text should fill 100 % up to the shell's max-width.

## Engineering Guidelines
- Read relevant files before editing.
- Keep edits focused and incremental.
- Prefer strict TypeScript-safe APIs for shared modules.
- Do not add heavy frameworks/build systems unless requested.
- Preserve mobile-first interactions and 44x44 touch targets.

## Validation Checklist (Every Change)
1. Type safety:
   - `npm run typecheck`
2. Unit tests:
   - `npm run test`
   - includes image catalog + family consistency checks (`tests/unit/pixelAssetCatalog.test.ts`, `tests/unit/assetFamilyConsistency.test.ts`)
3. Entry wiring:
   - verify routes/scripts in:
     - `/Users/m/Desktop/berries/index.html`
     - `/Users/m/Desktop/berries/games/fruit-stacker/index.html`
4. Launcher smoke:
   - open launcher and confirm 9 cards render.
   - verify age and skill filters update results.
   - verify EN/ES switching updates labels.
5. Fruit Stacker smoke:
   - mouse/touch/keyboard aiming changes drop lane.
   - merge through `Watermelon -> Pumpkin`.
   - confirm Pumpkin does not merge further.
   - verify restart and game-over overlays.

## Near-Term Roadmap
- Implement gameplay for remaining 8 game slots.
- Expand badge system with cross-game achievements.
- Add optional parent gate for settings/outbound links.
- Add CI workflow for typecheck + tests on PRs.
