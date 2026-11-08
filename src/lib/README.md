# lib

## Overview

Server and shared modules for the Boundless community app: the Postgres access
layer, cookie sessions with email sign-in codes, post and comment queries, board,
culture, and landmark definitions, interface i18n, community translation through
MyMemory, and the static list of official help contacts. Pages in `src/app` and
components in `src/components` import these modules through the `@/lib/*` alias.

## Interface

- `db.ts`: `db()` (lazy shared `pg.Pool`), `q<T>(sql, params)` (returns rows),
  `isId(s)` (bigint id guard), `track(name, userId)` (writes an event without awaiting it).
- `auth.ts`: `type User`, `getUser` (React `cache`d), `startSession`, `endSession`,
  `markVerified`, `verifiedEmail`, `issueCode`, `consumeCode`, `normalizeEmail`,
  `isAdmin`, `canViewQueue`, `isDemoEmail`, `demoEnabled`, `DEMO_MODERATOR`,
  `getLang`, `getT`.
- `mail.ts`: `sendCodeMail(to, code, t)`.
- `posts.ts`: `type PostRow`, `type CommentRow`, `PAGE` (20), `listPosts`,
  `hotPosts`, `myPosts`, `savedPosts`, `getPost`, `getComments`, `newReplies`,
  `unreadCount`, `communityStats`, `boardCounts`, `loungeCount`, `ranking`,
  `myPoints`, `recentActivity`, `memberCount`.
- `boards.ts`: `type Tag`, `type Board`, `BOARDS` (chat, love, market, food,
  popup, trip, korean, transit, visa, housing, health, work), `LOUNGE`, `GROUPS`,
  `boardOf`, `isBoard`, `tagOf`, `ASKING_TAGS`, `DEALS`, `LEVELS`, `levelOf`.
- `cultures.ts`: `type Palette`, `type Culture`, `DEFAULT_CULTURE` (`XX`),
  `CULTURES` (CN, VN, TH, US, UZ, MN, PH, NP, ID, JP, KH, KZ, RU, FR, IN),
  `cultureOf`, `cultureFromLanguages`, `landmarkMarkup`, `patternUrl`, `themeVars`.
- `landmarks.ts`: `LANDMARKS` (one SVG draw function per culture code),
  `landmarkSvg(code, palette)`.
- `i18n.ts` (client-safe): `LANGS`, `type Lang`, `isLang`, `LANG_NAMES`,
  `MACHINE_LANGS`, `toLang`, `pickLang`, `type T`, `type Dict`, `translatorOf`,
  `COUNTRIES`, `isCountry`, `countryName`, `sortedCountries`, `REGIONS`, `isRegion`,
  `regionLabel`, `VISAS`, `isVisa`, `visaLabel`, `POST_LANGS`, `langAutonym`, `langName`, `READ_LANGS`,
  `readLangOf`, `REPORT_REASONS`, `timeAgo`.
- `messages.ts`: `dictOf(lang)`, `translator(lang)`.
- `en.ts`: `EN` (English UI strings keyed by the Korean sentence).
- `translate.ts`: `translateItem(item, src, to)`.
- `guide.ts`: `type Help`, `HOTLINES`, `SITES`, `APPS`, `helpFor(topic)`.
- `locales/`: machine-translated dictionaries (`<lang>.json`, no source code),
  imported by `messages.ts`.

## Invariants

- Viewer-aware queries in `posts.ts` (`listPosts`, `hotPosts`, `getPost`,
  `getComments`, `recentActivity`, and others built on `POST_COLS`) take the
  viewer's user id (or `NULL`) as `$1`. `NOT_BLOCKED` hides content from accounts
  the viewer blocked.
- `listPosts` options `visa` (exact match) and `words` (title `ILIKE ANY`, used by
  `similarPosts`). `PostRow` carries `visa` and `accepted_comment_id`; `top_answer` prefers
  the accepted reply and sets `accepted: true` for it.
- `listPosts` does not check lounge access: callers must allow a country `space`
  only for members of that nationality.
- `getPost` rejects ids that fail `isId` before querying. Other code should check
  ids from forms or URLs with `isId` before they reach SQL.
- Session and verified-email cookies are HMAC-SHA256 tokens
  (`value.expiresAt.signature`) that `SESSION_SECRET` signs. `unseal` returns
  `null` for a bad signature or an expired token.
- Sign-in codes: 6 digits, valid 10 minutes, one issue per 60 seconds, at most 10
  per day per email, 5 tries per code (`issueCode`, `consumeCode`). A code works once.
- Demo accounts (`@example.com` when `DEMO_LOGIN=1`) never get admin rights
  (`isAdmin`). The demo moderator gets the report queue in read-only mode only
  (`canViewQueue`).
- i18n keys are the Korean sentence. Korean returns the key, English uses `EN`,
  and other languages fall back to `EN` for missing lines (`dictOf`). Every key
  used in `src/` needs an `EN` line (`scripts/i18n-check.mjs`).
- `i18n.ts` must stay client-safe. `messages.ts` and the locale JSON stay on the
  server so only the current language reaches the browser.
- Member points are `posts + 2 * answers + 3 * helped` (`SCORE` in `posts.ts`,
  `LEVELS` in `boards.ts`).
- Unknown board, culture, or landmark codes fall back to `BOARDS[0]`,
  `DEFAULT_CULTURE`, and `LANDMARKS.XX`.

## Side Effects

- Postgres through `DATABASE_URL` (pool max 3, SSL except on localhost). Tables
  read: `boundless.users`, `posts`, `comments`, `post_likes`, `comment_likes`,
  `saves`, `blocks`, `appeals`, and view `member_points`. Tables written:
  `login_codes` (`issueCode`, `consumeCode`), `translations` (`translateItem`),
  `events` (`track`; errors are ignored).
- Cookies through `next/headers`: `bl_session` (30 days), `bl_verified` (30
  minutes), and reading `lang`. `getLang` also reads the `accept-language` header.
- SMTP to `smtp.gmail.com:465` with `EMAIL_SENDER` / `EMAIL_PASSWORD`
  (`sendCodeMail`). Without them, development logs the code to the console and
  returns it, and production throws.
- HTTPS calls to `api.mymemory.translated.net` (8 s timeout, optional
  `MYMEMORY_EMAIL`), split into chunks of up to 400 bytes (`translateItem`).
- Environment variables read: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAILS`,
  `DEMO_LOGIN`, `NODE_ENV`, `EMAIL_SENDER`, `EMAIL_PASSWORD`, `MYMEMORY_EMAIL`.
- Caches held in module memory: the `pg` pool, merged dictionaries, `Intl`
  formatters, and the culture SVG markup.

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run i18n` (fails when a Korean key has no line in `en.ts`)
- Run: `npm run e2e` (end-to-end flow in `e2e/flow.mjs`)
