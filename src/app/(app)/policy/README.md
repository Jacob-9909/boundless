# policy

## Overview

`/policy`: the community rules members agree to at sign-up, on one static page.
It covers what is public, the minimum age, nationality correction, reports,
appeals, data after account deletion, and translation.

## Interface

- `page.tsx`: `PolicyPage` (default export), `metadata` (title `Policy`).
  - Section ids (usable as URL fragments): `public`, `age`, `nationality`, `reports`,
    `appeals`, `delete`, `translation`.

## Invariants

- The page text states rules that `src/app/actions.ts` enforces: age 14+
  (`completeSignup`), one nationality change per 30 days (`updateNationality`), one
  appeal per hidden item (`appeal`), and hard delete on withdrawal (`deleteAccount`).
  Update this page when those actions change.

## Side Effects

- None. The page is static text.

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run i18n`
