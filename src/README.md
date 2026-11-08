# Boundless `src` Blueprint

## System Overview

Next.js App Router source for Boundless, an anonymous community for foreigners living in Korea.
There are three layers:

- `app/` holds routes and every server action. Pages render on the server. Member writes go through `app/actions.ts`.
- `components/` holds shared React UI: server components take a `t: T` prop, and client components read `useT()` from `I18n`.
- `lib/` holds server and shared modules. These cover Postgres access, cookie sessions and sign-in codes, viewer-aware queries, boards and culture themes, i18n dictionaries, the MyMemory translation cache, and official help contacts.

Data flow: a page in `app/` reads through `lib/posts.ts` and `lib/auth.ts` and renders `components/`. Forms post to server actions in `app/actions.ts`, which validate input, write `boundless.*` tables through `lib/db.ts:q`, then call `redirect()` or `refresh()`.

## Subdirectories & System Boundaries

- app: [./app/README.md](./app/README.md) - Root layout, landing page `/`, PWA manifest, 404, and all server actions (`actions.ts`: sign-in, posts and comments, safety, account, moderation). Member pages live in the `(app)` route group; `/login` and `/api/health` sit outside it.
- components: [./components/README.md](./components/README.md) - Shared UI with 13 `.tsx` files: `ui.tsx` tokens and cards, `Feed.tsx`, `Community.tsx` (right rail, account switcher), navigation, `forms.tsx`, `LoginScreen.tsx`, `I18n.tsx`, `Translate.tsx`, `Share.tsx`, `HelloRotator.tsx`.
- lib: [./lib/README.md](./lib/README.md) - `db.ts`, `auth.ts`, `mail.ts`, `posts.ts`, `boards.ts`, `cultures.ts`, `landmarks.ts`, `i18n.ts`, `messages.ts`, `en.ts`, `translate.ts`, `guide.ts`. `lib/locales/` holds only JSON dictionaries and has no contract file.

## Global Invariants

- UI strings are Korean sentences used as dictionary keys (`lib/messages.ts:dictOf`). `scripts/i18n-check.mjs` fails when a key has no English line in `lib/en.ts`. Server action errors are also Korean keys, and the client translates them.
- Only the current language's dictionary reaches the browser (`app/layout.tsx` passes `dictOf(lang)` to `components/I18n.tsx:I18n`). `lib/i18n.ts` is client-safe; `lib/messages.ts` and `lib/locales/*.json` stay on the server.
- Sessions are HMAC-SHA256 signed cookies (`lib/auth.ts:seal`/`unseal`, `SESSION_SECRET`). Member actions redirect to `/login` without a session (`app/actions.ts:requireUser`).
- Sign-in codes are 6 digits and valid for 10 minutes. One code can be issued per 60 seconds, at most 10 per day per email. Each code allows 5 tries and works once (`lib/auth.ts:issueCode`/`consumeCode`).
- Rate limits: 5 posts and 30 comments per user per hour (`app/actions.ts:recentCount`).
- Owner-only writes scope SQL to `user_id` (`updatePost`, `setDeal`, `toggleSolved`, `deleteOwn`, `appeal`).
- Demo `@example.com` accounts never get admin rights. The demo moderator sees the queue read-only (`lib/auth.ts:isAdmin`/`canViewQueue`). `/admin` actions re-check `isAdmin`.
- Country lounges: `lib/posts.ts:listPosts` does not check lounge access, so callers restrict it. `createPost` sets `space = user.nationality` for lounge posts, and `addComment`/`translate` refuse other-nationality lounge content.
- Viewer-aware queries take the viewer id (or NULL) as `$1` and hide blocked accounts (`lib/posts.ts:NOT_BLOCKED`).
- Ids must match `/^\d{1,18}$/` before they reach SQL (`lib/db.ts:isId`).
- Points = posts + 2 × answers on others' posts + 3 × helpful votes received (`lib/posts.ts:SCORE`, `lib/boards.ts:LEVELS`).
- Policy values (`app/actions.ts`): age floor 14 (`completeSignup`), nationality change once per 30 days (`updateNationality`), one appeal per hidden item (`appeal`).

## Global Side Effects

- PostgreSQL through `DATABASE_URL` (`lib/db.ts:db`, pool max 3). Tables written: `boundless.users`, `posts`, `comments`, `post_likes`, `comment_likes`, `saves`, `reports`, `appeals`, `blocks`, `login_codes`, `translations`, `events`. Schema is in `../db/schema.sql`.
- DB writes outside `app/actions.ts`: `app/(app)/me/page.tsx` updates `users.seen_at` during render; `app/(app)/search/page.tsx` calls `lib/db.ts:track("search")`, a fire-and-forget insert into `boundless.events`.
- Cookies: `bl_session` (30 days), `bl_verified` (30 minutes), `lang`, and `culture` (1 year, set by `components/LoginScreen.tsx`).
- Gmail SMTP `smtp.gmail.com:465` for sign-in codes (`lib/mail.ts:sendCodeMail`, `EMAIL_SENDER`/`EMAIL_PASSWORD`). Without SMTP, development logs and returns the code, and production throws.
- HTTPS to `api.mymemory.translated.net` for post translation (`lib/translate.ts`, optional `MYMEMORY_EMAIL`). Results are cached in `boundless.translations`, and edit or delete actions clear the cache rows.
- Browser `localStorage` key `draft:<key>` for new-post drafts (`components/forms.tsx:WriteForm`).
- Environment variables read: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAILS`, `DEMO_LOGIN`, `NODE_ENV`, `EMAIL_SENDER`, `EMAIL_PASSWORD`, `MYMEMORY_EMAIL`.

## System Verification

`package.json` has no `test` script. Run these instead:

- Run: `npm run lint`
- Run: `npm run i18n`
- Run: `npm run build`
- Run: `BASE_URL=http://localhost:3000 npm run e2e` (needs a running dev server and a seeded database; see `../e2e/flow.mjs`)
