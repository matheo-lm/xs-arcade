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
- Game over triggers only after sustained top-line overflow.

## Asset Policy
- Image assets must use 8-bit pixel-art style.
- Image sources must be local-only under `/Users/m/Desktop/berries/public/assets/` (no CDN or remote image URLs).
- Every image used by platform or games must have a catalog record in `/Users/m/Desktop/berries/content/assets/pixel-art.json`.
- Use SVG assets only for the pixel imaging system.
- Do not add heavyweight asset pipelines unless requested.

## 8-Bit Pixel Imaging Policy (Required)
- This policy applies to launcher UI, shared UI, game cards, placeholder pages, and all game sprites.
- No visual icon/image exceptions: footer, settings, and gameplay imagery must all follow the same pixel-art system.
- `content/games/*.json` `cardIcon` values must be local `/assets/...svg` paths.
- Fruit Stacker sprite URLs must be local `/assets/fruits/*.svg` paths.
- New image files require:
  - placement in `/Users/m/Desktop/berries/public/assets/` (appropriate subfolder)
  - matching entry in `/Users/m/Desktop/berries/content/assets/pixel-art.json`

## Localization Policy
- All user-facing shared UI copy must be present in both `en` and `es`.
- New translation keys require updates in:
  - `/Users/m/Desktop/berries/src/shared/i18n/dictionaries.ts`
  - `/Users/m/Desktop/berries/public/locales/en/common.json`
  - `/Users/m/Desktop/berries/public/locales/es/common.json`

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
   - includes pixel asset policy checks (`tests/unit/pixelAssetCatalog.test.ts`)
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
