# components

## Overview

The shared React UI layer for Boundless, a community where foreigners living in Korea ask questions anonymously and swap everyday tips. The directory is flat and has no subdirectories. It mixes server components (no directive: `ui.tsx`, `Feed.tsx`, `Community.tsx`, `LangMenu.tsx`, `Icon.tsx`) with client components (`"use client"`: `I18n.tsx`, `forms.tsx`, `LoginScreen.tsx`, `Translate.tsx`, `Share.tsx`, `SideNav.tsx`, `BottomNav.tsx`, `HelloRotator.tsx`). Data comes from `src/lib/*`, and every write goes through server actions in `src/app/actions.ts`. These components never call `fetch` or the database themselves.

## Interface

### Design system and primitives (`ui.tsx`, `Icon.tsx`)

- Class-string tokens: `card`, `btn`, `btnGhost`, `pill`, `tag`, `field`, `labelCls`, `postList`. `LINES` holds the Seoul subway line colors used as the brand palette.
- `Icon({ name, size, filled, className })` draws a single-path stroke SVG from the `PATHS` table. `IconName` is `keyof typeof PATHS`.
- Brand and identity: `Logo`, `Flag` (SVG flag by country code), `Landmark` (culture silhouette from `landmarkMarkup`), `Avatar` (culture pattern plus a flag badge), `NationalityChip`, `LevelBadge`, `StationLabel`.
- Board and post display: `BoardBadge`, `TagText` (`[말머리]` form), `MarketLine`, `EventLine`, `PostCard` (feed item with a helpful toggle), `HelpItem` (hotline or website link).
- Page scaffolding: `PageHead`, `BackLink`, `Notice` (`tone: "info" | "error"`), `SignInRequired`.

### Lists and feeds (`Feed.tsx`)

- `type Sort = "new" | "likes" | "waiting"`. `parseSort(v)` falls back to `"new"`.
- `listHref(base, cur, change)` builds a list URL with one option changed. It leaves out `sort=new` and an empty `tag`.
- `ListControls`: tag chips and the sort tabs.
- `FeedList`: renders `PostCard`s or an empty `Notice`. It shows a "load older" link only when `posts.length === PAGE`.

### Community chrome (`Community.tsx`)

- `WithRail`: page body plus a sticky right rail on `xl` screens.
- `RightRail` (async server component): the ranking, the viewer's level, questions waiting for an answer, hot posts and recent activity.
- `AccountSwitcher`: sample-account picker that posts to `demoLogin`.

### Navigation (`SideNav.tsx`, `BottomNav.tsx`, `LangMenu.tsx`)

- `SideNav({ items, label, compact })` with `type NavItem`. `BoardNav({ label, groups })` with `type BoardLink`.
- `BottomNav({ labels, unread })`: fixed five-item mobile tab bar (`/feed`, `/boards`, `/lounge`, `/me`, `/settings`).
- `LangMenu({ lang, label, note, tone, align, up, compact })`: interface-language picker built on `<details>`, one `setLang` form per language in `LANGS`.

### Forms (`forms.tsx`, all wired with `useActionState`)

- `WriteForm`: shared new-post and edit form. The caller passes the server action, and the fields adapt to the `Board`. Global posts on `life` boards get an optional `visa` select (`VISAS`). For new posts (`draftKey` set), typing a title calls `similarPosts` after a 400 ms debounce and lists up to 3 matches.
- `CommentForm({ action, parent })`, `ReportForm` (`reportContent`), `NationalityForm` (`updateNationality`), `AppealForm` (`appeal`).

### Auth, i18n and misc

- `LoginScreen({ lang, initial, next, countries, demo })`: three steps (`"email" | "code" | "profile"`) through `sendCode`, `verifyCode` and `completeSignup`, plus a culture picker and an optional `demoLogin` button.
- `I18n({ dict, children })`: context provider for the current language's dictionary. `useT()` returns a `T` translator built by `translatorOf`.
- `Translatable({ kind: "p" | "c", id, body, target, className, small })`: toggles between the original text and a translation from the `translate` action.
- `ShareButton({ title, className })`: `navigator.share` when the browser has it, otherwise copies the link to the clipboard.
- `HelloRotator({ items, label })` with `type Hello`: cycles greetings through every culture.

## Invariants

- UI strings are Korean source keys passed to `t(...)`, for example `t("공유")`. `scripts/i18n-check.mjs` fails when a Korean key used under `src/` has no English line in `src/lib/en.ts`. Add new keys there.
- Server components (`ui.tsx`, `Feed.tsx`, `Community.tsx`, `LangMenu.tsx`, `Icon.tsx`) take a `t: T` prop and must not use hooks. `LangMenu` is hook-free on purpose so both server pages and the client `LoginScreen` can render it. Client components get `t` from `useT()` and need an `I18n` ancestor.
- `LangMenu` renders `<details key={lang}>`. After a pick the page re-renders in the new language and the key change closes the popover.
- `PostCard`: the title link stretches over the whole card, and the `toggleLike` form sits above it (`relative z-20`) so it stays clickable.
- Navigation highlighting: `SideNav` marks an item active on an exact match or a `href + "/"` prefix. `BoardNav` needs an exact match. `BottomNav` uses `path.startsWith(href)`.
- Badge counts above 9 show as `"9+"` (`SideNav`, `BottomNav`).
- `HelloRotator` stops rotating under `prefers-reduced-motion: reduce`. It clamps per-greeting font scale to `[0.55, 1.3]` and keeps the heading line height fixed with `leading-[0]`.
- `WriteForm` restores a saved draft only when the body field is empty. Drafts exist only when `draftKey` is set, which the code limits to new posts.
- `AccountSwitcher` maps the default culture (`XX`) to the `CA` sample account.
- `Icon` uses `aria-hidden="true"`. Give the parent control the accessible name.

## Side Effects

- Server actions from `src/app/actions.ts`: `toggleLike` (`PostCard`), `demoLogin` (`AccountSwitcher`, `LoginScreen`), `setLang` (`LangMenu`, `LoginScreen`), `sendCode`, `verifyCode` and `completeSignup` (`LoginScreen`), `translate` (`Translatable`, which the server caches after the first request), `reportContent`, `updateNationality` and `appeal` (`forms.tsx`). `WriteForm` and `CommentForm` call whatever action the caller passes in.
- Database reads: `RightRail` calls `ranking`, `myPoints`, `listPosts`, `hotPosts` and `recentActivity` from `src/lib/posts.ts` while it renders.
- `localStorage`: `WriteForm` writes `draft:${draftKey}` on every input event and removes it on submit.
- Cookie: `LoginScreen`'s `saveCulture` sets `culture=<code>; path=/; max-age=31536000; samesite=lax`.
- Navigation: `LoginScreen` calls `router.replace(next)` and then `router.refresh()` once sign-in finishes.
- Browser APIs: `ShareButton` uses `navigator.share` or `navigator.clipboard.writeText` and a 2.5 s timer. `HelloRotator` runs a 2.2 s interval, `document.fonts.load` and canvas text measurement.

## Verification

- Run: `npm run lint`
- Run: `npm run i18n` (checks the Korean keys passed to `t(...)` against `src/lib/en.ts`)
- Run: `npm run e2e` (Playwright flow in `e2e/flow.mjs`. It needs a running server in dev-mail mode with `EMAIL_SENDER` unset, `BASE_URL` set (default `http://localhost:3000`), `CHROME_PATH`, and `ADMIN_EMAILS` including `admin@example.com`.)
