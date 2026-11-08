# login

## Overview

`/login`: the email-code sign-in screen, outside the `(app)` shell. It picks a
starting culture for the welcome screen and renders `LoginScreen`. `fonts.ts`
also supplies per-culture display fonts to the landing page and the app shell.

## Interface

- `page.tsx`: `LoginPage` (default export), `metadata` (title `Sign in`).
  - Reads search params `next` and `culture`.
  - Renders `LoginScreen` with `lang`, `initial` (culture code), `next`,
    `countries` (`sortedCountries(lang)`), and `demo` (`demoEnabled()`).
- `fonts.ts`: `cultureFonts`, a space-separated string of CSS variable class names
  for 15 Google display fonts (`--font-cn`, `--font-jp`, `--font-vn`, `--font-th`,
  `--font-uz`, `--font-mn`, `--font-kz`, `--font-ph`, `--font-np`, `--font-id`,
  `--font-kh`, `--font-ru`, `--font-fr`, `--font-us`, `--font-in`). It is imported
  by `../page.tsx` and `../(app)/layout.tsx`.

## Invariants

- `next` is accepted only if it starts with `/` and not `//`, which blocks open
  redirects to other hosts; otherwise it is `/feed` (`page.tsx:LoginPage`).
- A signed-in user is redirected to `next` at once.
- Starting culture: the `culture` search param, then the `culture` cookie, then the
  first match from `Accept-Language` (`cultureFromLanguages`), then `XX`.
- Every font in `fonts.ts` uses `preload: false`, so a face downloads only when used.

## Side Effects

- Reads the session (`getUser`), the `culture` cookie, and the `accept-language` header.
- Sign-in itself runs in `LoginScreen` (`src/components/LoginScreen.tsx`) through the
  `sendCode`, `verifyCode`, `completeSignup`, `demoLogin`, and `setLang` server actions
  (`../actions.ts`); that component also writes the `culture` cookie in the browser.

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run e2e` (needs a running server in dev-mail mode; see the header of `e2e/flow.mjs`)
