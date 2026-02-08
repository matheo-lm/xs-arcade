# Security Best Practices Review - Berries Arcade

## Executive summary
The codebase has a small client-side attack surface and avoids major risky patterns like `eval`, third-party script tags, and unsafe external link handling. However, there is one high-impact DOM XSS risk in launcher rendering (persistent via local storage), plus missing browser hardening controls (CSP and security headers) that should be added for secure-by-default deployment.

## Scope and method
- Stack reviewed: TypeScript + Vite static web frontend.
- Guidance source: `/Users/m/.codex/skills/security-best-practices/references/javascript-general-web-frontend-security.md`.
- Review focus: DOM injection sinks, storage trust boundaries, navigation, service worker, and browser security headers.

## High severity

### SBP-001: Persistent DOM XSS risk from unescaped profile data in `innerHTML`
- Severity: High
- Location:
  - `/Users/m/Desktop/berries/src/platform/main.ts:174`
  - `/Users/m/Desktop/berries/src/platform/main.ts:203`
  - `/Users/m/Desktop/berries/src/shared/storage/platformStorage.ts:79`
  - `/Users/m/Desktop/berries/src/shared/storage/platformStorage.ts:90`
- Evidence:
  - `app.innerHTML = \`...\`` builds the launcher DOM as a template string.
  - Profile names are inserted directly into HTML: ``<option ...>${profile.name}</option>``.
  - Profile data is sourced from `localStorage` and accepted with minimal structural validation (`safe.profiles = Array.isArray(parsed.profiles) ? parsed.profiles : [];`).
- Impact:
  - A crafted profile value can inject markup/script context into the launcher and persist across sessions via local storage.
- Why this matters:
  - Storage values must be treated as untrusted; feeding them into `innerHTML` violates secure-by-default DOM XSS guidance.
- Recommended fix:
  1. Remove dynamic user-controlled values from HTML template strings.
  2. Create `<option>` elements using DOM APIs and assign `.textContent` and `.value`.
  3. Add strict input validation for profile names (length and allowed characters).
  4. Strengthen storage sanitization so profile objects are rebuilt from validated primitives, not copied through.
- Mitigation if full fix is staged:
  - Escape all interpolated dynamic values before insertion, then migrate to DOM API construction in a follow-up.

## Medium severity

### SBP-002: Missing CSP and response-header hardening
- Severity: Medium
- Location:
  - `/Users/m/Desktop/berries/index.html:1`
  - `/Users/m/Desktop/berries/games/fruit-stacker/index.html:1`
  - `/Users/m/Desktop/berries/vercel.json:1`
- Evidence:
  - No CSP is present in entry HTML files.
  - No Vercel header configuration is present for CSP and standard browser hardening headers.
- Impact:
  - If DOM injection occurs, there is limited browser-side containment.
- Recommended fix:
  1. Add response headers in `vercel.json`, at minimum:
     - `Content-Security-Policy` (start with restrictive `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`).
     - `X-Content-Type-Options: nosniff`.
     - `Referrer-Policy: strict-origin-when-cross-origin`.
     - `Permissions-Policy` (disable capabilities not needed).
  2. Keep policy compatible with Vite assets and adjust only as required.
  3. Prefer header-delivered CSP over `<meta http-equiv>`.
- False-positive note:
  - Headers may be configured outside this repo (dashboard/edge). They are not visible in code and should be runtime-verified.

## Low severity

### SBP-003: Service worker caches all same-origin GET responses by default
- Severity: Low
- Location:
  - `/Users/m/Desktop/berries/public/sw.js:27`
  - `/Users/m/Desktop/berries/public/sw.js:31`
- Evidence:
  - Fetch handler caches any successful same-origin `GET` response.
- Impact:
  - Overly broad caching can retain unexpected responses and make future changes harder to secure as the app grows.
- Recommended fix:
  1. Restrict cache writes to explicit allowlisted asset paths/types.
  2. Avoid caching HTML navigations unless explicitly intended.
  3. Keep a separate strategy per resource type (app shell vs static assets).

### SBP-004: Profile input lacks secure-by-default constraints
- Severity: Low
- Location:
  - `/Users/m/Desktop/berries/src/platform/main.ts:73`
  - `/Users/m/Desktop/berries/src/shared/storage/platformStorage.ts:144`
- Evidence:
  - Profile names from `window.prompt` are accepted with only `.trim()`.
- Impact:
  - Unbounded or unexpected input can degrade UX, increase storage abuse risk, and increase injection risk when rendering logic regresses.
- Recommended fix:
  1. Enforce max length (for example 24 chars).
  2. Restrict allowed character set for display names.
  3. Normalize and validate before persistence.

## Positive observations
- External links using `target="_blank"` include `rel="noopener noreferrer"`:
  - `/Users/m/Desktop/berries/src/platform/main.ts:245`
  - `/Users/m/Desktop/berries/src/platform/main.ts:258`
- No `eval` / `new Function` / `postMessage` usage found in app code.
- Game header renderer uses escaping for interpolated text:
  - `/Users/m/Desktop/berries/src/shared/ui/gameHeader.ts:23`

## Suggested secure-by-default implementation order
1. Fix SBP-001 (DOM XSS path for profile rendering and storage validation).
2. Add CSP and response headers (SBP-002).
3. Tighten service worker cache strategy (SBP-003).
4. Add input constraints for profile names (SBP-004).
