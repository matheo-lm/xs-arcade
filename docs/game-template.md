# Game Template

Use this checklist when adding a new game.

## 1. Create Route
- Add page: `/Users/m/Desktop/berries/games/<slug>/index.html`
- Add script entry: `/Users/m/Desktop/berries/src/games/<slug>/main.ts`

## 2. Add Manifest
Create `/Users/m/Desktop/berries/content/games/<slug>.json` with all required fields:
- `id`, `slug`, `path`, `status`
- `title.en`, `title.es`
- `description.en`, `description.es`
- `cardIcon`, `ageBands`, `skills`, `learningGoals`
- `difficultyPresets` for `4-5`, `6-7`, `8`

## 3. Register Build Input
Add the new page to `vite.config.ts` `build.rollupOptions.input`.

## 4. Shared Integrations
- Read active profile from `platformStorage`.
- Persist stars/high score/plays for game completion.
- Respect global mute setting.
- Use i18n strings for shared UI text.

## 5. Assets
- If using external CDN assets, add local fallback files in `public/assets/`.

## 6. Validation
- `npm run typecheck`
- `npm run test`
- launcher shows the new card with filters
- game route works on desktop and mobile browser
