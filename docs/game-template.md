# Game Template

Use this checklist when adding a new game.

## 1. Create Route
- Add page: `/Users/m/Desktop/berries/games/<slug>/index.html`
- Add script entry: `/Users/m/Desktop/berries/src/games/<slug>/main.ts`

## 2. Use Shared Game Header (Required)
- Import and render shared header chrome:
  - `src/shared/ui/gameHeader.ts`
  - `src/shared/ui/gameHeader.css`
- Required header layout:
  - back link
  - localized title
  - left meta pills as needed
  - right action buttons as needed
- Do not build custom one-off top bars for new games.

## 3. Add Manifest
Create `/Users/m/Desktop/berries/content/games/<slug>.json` with all required fields:
- `id`, `slug`, `path`, `status`
- `title.en`, `title.es`
- `description.en`, `description.es`
- `cardIcon`, `cardIconFallback`, `ageBands`, `skills`, `learningGoals`
- `difficultyPresets` for `4-5`, `6-7`, `8`

## 4. Register Build Input
Add the new page to `vite.config.ts` `build.rollupOptions.input`.

## 5. Shared Integrations
- Read active profile from `platformStorage`.
- Persist stars/high score/plays for game completion.
- Respect global mute setting.
- Respect persisted theme preference.
- Use i18n strings for shared UI text.

## 6. Pixel Style Rules
- Use shared tokens from `src/shared/ui/base.css`.
- Keep pixel-arcade framing and typography split (pixel headings/controls, readable body text).
- Preserve 44x44 touch targets and keyboard focus visibility.

## 7. Assets
- Add game icon and gameplay image assets in `public/assets/` using 8-bit pixel-art SVG style.
- `cardIcon` in `content/games/<slug>.json` must be a local `/assets/...svg` path.
- Do not use external image/CDN URLs.
- Add entries for every new image to `content/assets/pixel-art.json`.

## 8. Validation
- `npm run typecheck`
- `npm run test`
- launcher shows the new card with filters
- game route works on desktop and mobile browser
