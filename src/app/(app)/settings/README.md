# settings

## Overview

`/settings`: screen language for everyone. For members it also covers the public
nationality, region, reading language for translations, the member's report
history, blocked accounts, account deletion, and sign-out.

## Interface

- `page.tsx`: `SettingsPage` (default export), `metadata` (title `Settings`).
  - `LangMenu` (screen language, shown to everyone).
  - `NationalityForm` (`src/components/forms.tsx`) submits to `updateNationality`.
  - Forms: `setRegion` (field `region`), `setReadLang` (field `read_lang`),
    `unblockAll`, `deleteAccount` (checkbox `confirm`), `signOut`.
  - A link to `/admin` when `canViewQueue(user)`.

## Invariants

- Signed-out visitors see the language menu and a link to `/login?next=/settings`; the account sections need a session.
- Report status labels map `received`, `actioned`, and `dismissed`.
- Server-side rules live in the actions (`../../actions.ts`): nationality changes at
  most once per 30 days, invalid `region` or `read_lang` is stored as `NULL`, and
  `deleteAccount` does nothing unless `confirm=on`.

## Side Effects

- For members, reads the last 20 rows of `boundless.reports` filed by the user
  (joined to `comments` for the post id) and the count of `boundless.blocks` rows.
- Submissions update `boundless.users` (`nationality`, `region`, `read_lang`), delete
  the member's `boundless.blocks` rows, or hard-delete the account (with its cached
  translations) and end the session; `signOut` clears the session cookie.

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run e2e` (needs a running server; see the header of `e2e/flow.mjs`)
