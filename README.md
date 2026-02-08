# Berries Arcade

Berries Arcade is a kid-friendly web arcade platform for ages 4-8. It is designed as one deployable web app that hosts multiple lightweight learning games.

## Current Platform Scope
- Multi-page launcher + game routes.
- 9 game slots organized by learning goals.
- Bilingual UI at launch (`en`, `es`).
- Local-only profiles, stars, badges, and per-game progress.
- PWA-ready baseline (`manifest.webmanifest` + `sw.js`).

## Game Slots
1. `fruit-stacker` (playable)
2. `number-garden` (placeholder)
3. `shape-builder` (placeholder)
4. `pattern-parade` (placeholder)
5. `memory-trails` (placeholder)
6. `letter-lanterns` (placeholder)
7. `phonics-pop` (placeholder)
8. `word-match` (placeholder)
9. `color-craft` (placeholder)

## Tech Stack
- Vite + TypeScript (strict mode).
- Plain DOM rendering (no framework).
- Vitest for unit tests.
- Playwright for smoke E2E.

## Project Structure
- `/Users/m/Desktop/berries/index.html`: launcher entry page.
- `/Users/m/Desktop/berries/games/<slug>/index.html`: per-game pages.
- `/Users/m/Desktop/berries/src/platform/`: launcher shell and registry.
- `/Users/m/Desktop/berries/src/shared/`: shared i18n/audio/storage/types/ui.
- `/Users/m/Desktop/berries/src/games/`: game implementations.
- `/Users/m/Desktop/berries/content/games/`: game manifest metadata.
- `/Users/m/Desktop/berries/public/`: static assets, locales, PWA files.
- `/Users/m/Desktop/berries/docs/`: architecture, design, content, template docs.

## Development
Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview built site:

```bash
npm run preview
```

## Validation Commands
Type safety:

```bash
npm run typecheck
```

Unit tests:

```bash
npm run test
```

E2E smoke tests:

```bash
npm run test:e2e
```

## Fruit Stacker Rules (Canonical)
Merge chain:

`Cherry -> Lemon -> Orange -> Apple -> Pear -> Peach -> Melon -> Watermelon`

- Watermelon is terminal and does not merge further.
- Game over only triggers after sustained top-line overflow.

## Deployment (Vercel)
- Static output (`dist/`) from Vite build.
- `vercel.json` is configured for clean URLs and static output directory.

## Documentation
- Vision: `/Users/m/Desktop/berries/VISION.md`
- Architecture: `/Users/m/Desktop/berries/docs/architecture.md`
- Design principles: `/Users/m/Desktop/berries/docs/design-principles.md`
- EN/ES content style: `/Users/m/Desktop/berries/docs/content-style-en-es.md`
- New game template: `/Users/m/Desktop/berries/docs/game-template.md`
