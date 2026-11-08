# write

## Overview

`/write`: create a post in two steps. Step 1 picks where it goes (the member's
country lounge or a global board). Step 2 shows `WriteForm` with the fields for
that board and submits to `createPost`.

## Interface

- `page.tsx`: `WritePage` (default export), `metadata` (title `Write`).
  - Reads search params `space` (`lounge`), `board`, `kind`, `title`.
  - Step 1 links: `/write?space=lounge` and `/write?board=<id>` for each entry in `BOARDS`.
  - Step 2: `WriteForm` with `action={createPost}`, `space` `lounge` or `global`,
    `langs` from `POST_LANGS`, and `draftKey` `<space>:<board id>`.

## Invariants

- Signed-out visitors get `SignInRequired`, with `next` set to `/write` plus the original query (`page.tsx:WritePage`).
- Step 1 shows unless `space=lounge` or `board` passes `isBoard`.
- Prefill: `title` is cut to 120 characters; `kind` must be one of the board's tags (else
  the first tag); `region` comes from the member's profile; `lang` is guessed from the
  member's culture and falls back to `en` when it is not in `POST_LANGS`.
- `createPost` repeats all checks on the server (`../../actions.ts:readPost`) and allows 5 posts per hour.

## Side Effects

- None on render.
- `createPost` inserts into `boundless.posts` (with `space` set to the member's
  nationality for lounge posts, else `global`), records a `post` event, and
  redirects to `/posts/<id>`.

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run e2e` (needs a running server; see the header of `e2e/flow.mjs`)
