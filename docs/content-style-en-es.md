# EN/ES Content Style

## Locale Scope
Launch locales:
- English (`en`)
- Spanish (`es`)

## Tone
- Friendly, clear, and direct.
- Encourage action with short verb-first strings.
- Avoid sarcasm and idioms that do not translate cleanly.

## Copy Constraints
- Prefer <= 45 characters for button labels.
- Prefer <= 90 characters for game card descriptions.
- Keep age labels and skill labels consistent platform-wide.

## Translation Requirements
When adding a key:
1. Add key in `src/shared/i18n/dictionaries.ts`.
2. Add matching key in `public/locales/en/common.json`.
3. Add matching key in `public/locales/es/common.json`.
4. Verify UI rendering in both locales.

## Spanish Guidance
- Use neutral, child-friendly vocabulary.
- Keep grammar simple and avoid region-locked slang.
- If a direct translation is too long, prefer concise paraphrase.
