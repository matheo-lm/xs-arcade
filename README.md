# Berries Arcade

Berries Arcade is a kid-friendly web arcade project that starts with one game and grows into a small platform of classic-style browser games.

## Current Game
- **Fruit Stacker Arcade**: drop fruits, match two of the same type, and grow bigger fruits.
- Merge chain: Cherry -> Lemon -> Orange -> Apple -> Pear -> Peach -> Melon -> Watermelon.
- Designed for kids ages 5-7 with simple controls and clear visuals.
- Works on desktop and mobile browsers.

## Controls
- **Mouse**: move to aim, click to drop.
- **Touch**: slide to aim, tap to drop.
- **Keyboard**: left/right arrows to move, space or enter to drop.

## Tech Stack
- Plain HTML, CSS, and JavaScript.
- No build step required.
- External assets:
  - Google Fonts (`Press Start 2P`) for retro UI typography.
  - Twemoji CDN sprites for fruit images.

## Project Structure
- `/Users/m/Desktop/berries/index.html`
- `/Users/m/Desktop/berries/css/styles.css`
- `/Users/m/Desktop/berries/js/game.js`
- `/Users/m/Desktop/berries/vercel.json`
- `/Users/m/Desktop/berries/AGENTS.md`

## Run Locally
1. Open `/Users/m/Desktop/berries/index.html` in a browser.

## Validation
Run a syntax check after JS changes:

```bash
node --check /Users/m/Desktop/berries/js/game.js
```

Then test in browser:
- Fruit drops and merges correctly.
- Peach merges into Melon, and Melon merges into Watermelon.
- Mouse/touch/arrow aiming moves the drop location correctly.
- Game over only after sustained top overflow.
- Restart and Play Again reset the game.

## Deployment (Vercel)
This project is static, so it can be deployed as a static site on Vercel.
`/Users/m/Desktop/berries/vercel.json` is included for clean URL behavior.

Typical flow:
1. Push repo to GitHub.
2. Import project in Vercel.
3. Use default static-site settings.
4. Deploy and open from phone browser.

## Platform Roadmap
- Add a game launcher/home screen.
- Add multiple games under a unified structure.
- Share common UI/audio/storage utilities.
- Track per-game high scores locally.
