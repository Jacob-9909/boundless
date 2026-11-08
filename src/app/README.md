# app

## Overview

The Next.js App Router root for Boundless. It holds the root HTML layout (fonts,
`<html lang>`, the i18n provider), the public landing page at `/`, the web app
manifest, the 404 page, and every server action in `actions.ts`. Member-facing
pages live in the `(app)` route group, which adds no URL segment. `/login` and
`/api/health` sit outside that group and do not use the community shell.

## Interface

- `layout.tsx`: `RootLayout` (default export) reads `getLang()`, sets `<html lang>`,
  loads Google fonts (Bricolage Grotesque, Asta Sans, and Noto Sans, Noto Sans
  Thai, Noto Sans Khmer with `preload: false`), and wraps children in `I18n` with
  `dictOf(lang)`. It exports `metadata` (title template `%s · Boundless`) and
  `viewport` (`themeColor` `#1B3A6B`), and imports `globals.css`.
- `page.tsx`: `Landing` (default export, route `/`) is the marketing page with
  the metro-map hero, culture cards, latest posts, stats, the official-help
  preview, and the sample-account (`#demo`) section. It exports `metadata`
  (absolute title) and reads search param `intro`.
- `manifest.ts`: `manifest()` (default export) returns the PWA manifest with
  `start_url: "/feed"`, `display: "standalone"`, and icon `/icon.svg`.
- `not-found.tsx`: `NotFound` (default export), a bilingual 404 page linking to `/`.
- `icon.svg`: the app icon (Next.js file convention).
- `actions.ts` (`"use server"`): types `Result` (`{ error?, ok? }`) and `PostState`
  (`Result & { values? }`), plus these server actions:
  - Sign-in: `sendCode(rawEmail)`, `verifyCode(rawEmail, code)` (returns
    `next: "done" | "profile"`), `completeSignup(nationality, agreed)`,
    `demoLogin(code)`, `signOut()`, `setLang(lang)`.
  - Posts and comments: `createPost(_, f)`, `updatePost(postId, _, f)`,
    `addComment(postId, _, f)`, `setDeal(f)`, `translate(kind: "p" | "c", id)`,
    `setReadLang(f)`, `toggleLike(f)`, `toggleSave(f)`, `toggleSolved(f)`, `acceptAnswer(f)`,
    `similarPosts(board, lounge, title)`, `deleteOwn(f)`.
  - Safety: `reportContent(_, f)`, `appeal(_, f)`, `resolveAppeal(f)`, `blockAuthor(f)`, `unblockAll()`.
  - Account: `updateNationality(_, f)`, `setRegion(f)`, `deleteAccount(f)`.
  - Moderation: `moderate(f)`.
- Subdirectories:
  - [`(app)`](<./(app)/README.md>): the shared shell layout and all member-facing pages.
  - [`api`](./api/README.md): route handlers (`GET /api/health`).
  - [`login`](./login/README.md): the `/login` page and per-culture display fonts.

## Invariants

- Action errors are Korean dictionary keys; the client translates them (`actions.ts:Result`).
- Every form string is NFC-normalized and trimmed before use (`actions.ts:str`).
- Member-only actions call `requireUser()`, which redirects to `/login` without a
  session. `sendCode`, `verifyCode`, `completeSignup`, `demoLogin`, `signOut`,
  `setLang`, `translate`, `moderate`, and `resolveAppeal` do not call it.
- `moderate` and `resolveAppeal` redirect to `/feed` unless `isAdmin(user)`; demo
  `@example.com` accounts are never admins (`src/lib/auth.ts:isAdmin`).
- Owner-only writes filter SQL by `user_id` (`updatePost`, `setDeal`, `toggleSolved`,
  `acceptAnswer`, `deleteOwn`), so a call from anyone else changes nothing.
- `acceptAnswer` only accepts a visible top-level reply on that post by someone other than
  the author. Accepting sets `solved = true`; accepting the same reply again un-accepts it.
  Reopening through `toggleSolved` clears `accepted_comment_id`.
- `visa` is stored only for global posts on `life` boards and must pass `isVisa`.
- `similarPosts` takes the space from the session (`user.nationality` for lounges), never
  from the client, so it cannot show another country's lounge.
- Post validation (`actions.ts:readPost`): the board must pass `isBoard` (or be
  `LOUNGE.id` with `space=lounge`); the tag must belong to the board; title 2-120
  characters; body 2-5000; `lang` in `POST_LANGS`; region empty or valid; market
  price 1-9 digits unless the tag is `free`; place at most 80 characters; dates
  `YYYY-MM-DD` with the end not before the start.
- Rate limits: 5 posts and 30 comments per user per hour (`actions.ts:recentCount`);
  sign-in code requests are limited by `issueCode` (`src/lib/auth.ts`).
- `verifyCode` needs a 6-digit code. `completeSignup` needs the verified-email
  cookie, a valid country, and `agreed` (age 14+ and the community rules).
- Lounge posts are stored with `space = user.nationality`, others with
  `space = "global"`; `updatePost` never changes `space`.
- `addComment`: body 1-2000 characters; only on posts that are not hidden and whose
  space is `global` or the commenter's nationality. The post author is anonymous
  number 0; other commenters reuse their number in that post or get the next one.
  A reply to a reply attaches to the top-level comment (one level deep).
- `translate` refuses hidden content and lounge content from another nationality.
- `appeal`: owner only, hidden content only, reason 10-1000 characters, one appeal
  per target (`ON CONFLICT DO NOTHING`).
- `updateNationality` succeeds at most once every 30 days. `deleteAccount` needs `confirm=on`.
- `demoLogin` does nothing unless `demoEnabled()`. Code `MOD` signs in as
  `DEMO_MODERATOR`, and `XX` maps to `CA`.
- `/` redirects signed-in members to `/feed` unless `?intro` is set (`page.tsx:Landing`).

## Side Effects

- Postgres schema `boundless` through `q()` (`src/lib/db.ts`). Actions write
  `users`, `posts`, `comments`, `post_likes`, `comment_likes`, `saves`, `reports`,
  `appeals`, and `blocks`. Cached rows in `translations` (keys `p:<id>` and
  `c:<id>`) are deleted when that text is edited or deleted. `track()` inserts
  into `events` without awaiting it, for `signup`, `post`, `comment`, `report`, `appeal`,
  `solved`, `accepted`, and `helpful` (only when a like is added).
- Cookies: the session and verified-email cookies through `startSession`,
  `endSession`, and `markVerified` (`src/lib/auth.ts`). `setLang` writes `lang`
  (one year, `sameSite: "lax"`), and `demoLogin` deletes `lang`.
- Mail: `sendCode` sends the code with `sendCodeMail` (nodemailer). Demo
  `@example.com` addresses get the code back as `devCode` instead.
- Network: `translate` calls `translateItem` (`src/lib/translate.ts`).
- Navigation: `redirect()` after `createPost` and `updatePost` (to `/posts/<id>`),
  `deleteOwn` on a post (to `/me`), `blockAuthor` (to `/feed`), `signOut` and
  `deleteAccount` (to `/`), and `demoLogin` (to `/admin` or `/feed`). Other
  in-place mutations call `refresh()`.
- `deleteAccount` hard-deletes the `users` row (the database cascades to the
  member's content) and ends the session.
- The landing page reads `communityStats()`, `listPosts(null, { limit: 3 })`, and
  `recentActivity(null, 2)` (`src/lib/posts.ts`).

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run i18n`
- Run: `npm run e2e` (needs a running server; see the header of `e2e/flow.mjs`)
