# Architecture

## Runtime Model
- Multi-page app served as static files.
- Vite handles development and build output.
- Each game has a page route under `/games/<slug>/`.

## Layers
1. `src/platform/`
   - launcher shell
   - game registry access
2. `src/shared/`
   - `types/`: contracts and unions
   - `storage/`: local data persistence
   - `i18n/`: locale resolve + dictionaries
   - `audio/`: global mute + UI sound helpers
   - `ui/`: shared CSS primitives and game chrome
3. `src/games/`
   - per-game runtime implementation
4. `content/games/`
   - declarative metadata manifests
5. `public/`
   - static assets/locales/PWA files

## Key Contracts
- `GameManifest`: metadata required for launcher and filtering.
- `PlatformStorageApi`: profile/progression/settings persistence API.
- `LocaleCode`: `en | es`.

## Shared Game Chrome
- Canonical game header implementation:
  - `src/shared/ui/gameHeader.ts`
  - `src/shared/ui/gameHeader.css`
- Games should render shared header chrome instead of bespoke top bars.
- Shared header keeps navigation/title/meta/actions consistent across games.

## Data Flow
1. Launcher loads manifests via registry.
2. Locale resolved by query > stored setting > navigator > `en`.
3. Active profile selected from local storage.
4. Filters applied client-side to manifest list.
5. Game page updates profile progress back into storage.

## PWA Baseline
- `public/manifest.webmanifest` provides install metadata.
- `public/sw.js` caches shell assets and same-origin GET responses.
- Design remains online-first; game assets still load via network when needed.

## Asset Resilience
- External sprites may come from pinned CDN URLs.
- Every external sprite has a local fallback file under `public/assets/`.
