# me

## Overview

`/me`: the member's own posts, or their saved posts, plus a list of new replies
since their last visit.

## Interface

- `page.tsx`: `MePage` (default export), `metadata` (title `My posts`).
  - Reads search param `tab`: `saved` shows saved posts; any other value shows the member's posts.
  - Links: `/me`, `/me?tab=saved`, `/write`, `/posts/<id>`.

## Invariants

- Signed-out visitors get `SignInRequired` with `next=/me` (`page.tsx:MePage`).
- Opening the page marks new replies as read: `seen_at` is updated only when there is at least one new reply.

## Side Effects

- Reads `myPosts(user.id)` or `savedPosts(user.id)`, and `newReplies(user.id, user.seen_at)` (`src/lib/posts.ts`).
- Writes `UPDATE boundless.users SET seen_at = now()` when new replies exist, which
  clears the unread badge in the shell nav (`page.tsx:MePage`).

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run e2e` (needs a running server; see the header of `e2e/flow.mjs`)
