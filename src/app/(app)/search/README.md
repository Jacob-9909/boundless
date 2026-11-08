# search

## Overview

`/search`: search posts by text, board, author nationality, and region, sorted
by newest or most liked, with cursor paging. It is a plain GET form, so every
search has its own URL.

## Interface

- `page.tsx`: `SearchPage` (default export), `metadata` (title `Search`).
  - Reads search params `q`, `board`, `from`, `region`, `visa`, `sort`, `before`.
  - The GET form has fields `q`, `board`, `region`, `visa`, `sort`, and a hidden `from`.

## Invariants

- `q` is NFC-normalized, trimmed, and cut to 100 characters (`page.tsx:SearchPage`).
- `board`, `from`, `region`, and `visa` are dropped unless `isBoard`, `isCountry`, `isRegion`, or `isVisa` accepts them.
- `sort` is `likes` or `new`; `before` applies only when sort is `new`.
- No query runs unless at least one of `q`, `board`, `from`, `region`, or `visa` is set.
- The "more" link appears only when a full page (`PAGE` rows) came back and sort is `new`.

## Side Effects

- Reads `listPosts(viewerId, { query, board, nationality, region, visa, before, sort })` (`src/lib/posts.ts`).
- Records a `search` event through `track` when `q` is not empty.

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run e2e` (needs a running server; see the header of `e2e/flow.mjs`)
