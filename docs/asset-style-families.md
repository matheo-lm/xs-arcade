# Asset Style Families

This document defines the active visual contracts for runtime image families.

## fruit-stacker-fruits-v2
- Purpose: gameplay sprites and next-fruit preview in Fruit Stacker.
- Visual direction: outlined, playful, smooth silhouettes inspired by the pre-8-bit style.
- Canvas readability target: clear shape identity at small sizes and overlapping stacks.
- Asset format constraints:
  - runtime format: local SVG or local high-resolution PNG
  - preferred Fruit Stacker runtime format: PNG at source resolution with transparent background
  - fallback format: SVG with `viewBox: 0 0 64 64`
  - visual language: dark outline (`#111827` to `#1f2937` range), 2-3px equivalent weight, rounded silhouette grammar
  - highlights: 1-2 simple highlights per fruit, no muddy overblending
  - shading: 1 shadow/accent region max per fruit for clarity
  - negative space: keep center-mass readable; avoid thin details under 2px equivalent
- Family consistency rules:
  - all 10 tiers share the same outline/shading language
  - stem/leaf language is reused where applicable
  - silhouettes are distinct enough to parse quickly while falling

## launcher-card-icons-v2
- Purpose: launcher game card icons + shared fallback icon.
- Visual direction: custom in-house icon set with playful objects, not generic line-only glyphs.
- SVG constraints:
  - viewBox: `0 0 96 96`
  - framing: rounded card tile with high-contrast border and subtle highlight
  - stroke: dark outline (`#111827` to `#1f2937`), 3-4px, rounded joins/caps
  - object count: one primary scene object + optional secondary accent
  - negative space: maintain icon legibility at 40x40 render size in launcher cards
- Family consistency rules:
  - all 9 game icons and fallback icon share the same frame grammar
  - all icons use similar stroke/fill contrast and detail density

## Metadata Mapping
In `content/assets/pixel-art.json`, family entries for these sets should use:
- `familyId`: `fruit-stacker-fruits-v2` or `launcher-card-icons-v2`
- `styleProfile`: explicit family profile name
- `sourceLibrary`: `berries-internal`
- `sourceLicense`: `Internal`
- `sourceUrl`: `local://...`
- `normalized`: `true`
