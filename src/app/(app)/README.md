# (app)

## Overview

A Next.js route group (the parentheses add no URL segment) for every page that
uses the community shell: the desktop sidebar, the phone header, and the bottom
nav. The shell takes the member's culture colors; visitors see the neutral
`DEFAULT_CULTURE` theme. Each child directory is one route, and each page does
its own sign-in checks.

## Interface

- `layout.tsx`: `AppLayout` (default export).
  - Main nav (`SideNav`): `/feed`, `/lounge`, `/search`, `/me` (with the unread-reply badge).
  - `BoardNav`: every entry in `BOARDS`, grouped by `GROUPS`, with today's post count, linking to `/b/<id>`.
  - End nav: `/guide`, `/settings`, and `/admin` when `canViewQueue(user)`.
  - Account card (links to `/settings`) or a sign-in box (`/login`, `/#demo`),
    `AccountSwitcher` for demo accounts, `LangMenu`, `BottomNav`, a skip link to `<main id="main">`.
- `error.tsx` (`"use client"`): `ErrorPage({ error, reset })`, a translated retry box whose button calls `reset`.
- `loading.tsx`: `Loading` (default export), a skeleton with `aria-busy` and a `role="status"` label.
- Routes:
  - [`feed`](./feed/README.md): `/feed`, the home feed.
  - [`boards`](./boards/README.md): `/boards`, the board directory.
  - [`b`](./b/README.md): `/b/[board]`, one board's posts.
  - [`lounge`](./lounge/README.md): `/lounge`, the member's country lounge.
  - [`posts`](./posts/README.md): `/posts/[id]` and `/posts/[id]/edit`.
  - [`write`](./write/README.md): `/write`, create a post.
  - [`search`](./search/README.md): `/search`.
  - [`me`](./me/README.md): `/me`, own and saved posts, new replies.
  - [`settings`](./settings/README.md): `/settings`.
  - [`report`](./report/README.md): `/report`, report or block.
  - [`admin`](./admin/README.md): `/admin`, the moderation queue.
  - [`guide`](./guide/README.md): `/guide`, official help contacts.
  - [`policy`](./policy/README.md): `/policy`, community rules.

## Invariants

- The layout never redirects; access control lives in each page and in the server actions.
- The `/admin` nav item appears only when `canViewQueue(user)` (`layout.tsx:AppLayout`).
- `AccountSwitcher` appears only when `demoEnabled()` and the member's email ends in `@example.com`.
- Unread count and points are computed only for signed-in members.

## Side Effects

- Each render reads `getUser` (session cookie), `unreadCount(user.id, user.seen_at)`,
  `boardCounts()`, and `myPoints(user.id)` (`src/lib/posts.ts`), and the language
  through `getT`. The layout writes nothing.

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run i18n`
- Run: `npm run e2e` (needs a running server; see the header of `e2e/flow.mjs`)
