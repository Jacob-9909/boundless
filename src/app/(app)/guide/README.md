# guide

## Overview

`/guide`: a static page of official help for foreign residents. It shows hotlines,
websites, and apps from `src/lib/guide.ts`.

## Interface

- `page.tsx`: `GuidePage` (default export), `metadata` (title `Official help`).
  - Renders `HOTLINES`, `SITES`, and `APPS` with `HelpItem`.

## Invariants

- None

## Side Effects

- None. The content is static data; `getT` reads the language cookie or `Accept-Language`.

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run i18n`
