## README.md

- 공식 안내 범위: 46행은 "비자·의료·법률 글 아래에" 공식 기관을 보여 준다고 쓴다. 실제로는 `src/app/(app)/posts/[id]/page.tsx:54`가 모든 글에서 `helpFor(post.topic)`를 부르고, `src/lib/guide.ts`의 topics 매핑이 12개 게시판 전부(교통, 여행, 팝업, 맛집, 한국어, 노가리, 연애, 장터 포함)에 기관을 붙인다. "법률" 게시판은 없다. 법률구조공단(132)은 `housing`, `work`, `market`에 붙어 있다.
- 검색 안내 문구가 서로 맞지 않는다: 40행은 "원문과 번역문을 함께 검색"한다고 쓰고, 코드도 그렇게 동작한다(`src/lib/posts.ts:107`, `boundless.translations`에서도 ILIKE로 찾는다). 하지만 검색어를 넣기 전 화면의 안내 문구 `src/app/(app)/search/page.tsx:93`은 "검색은 원문을 기준으로 해요."라고 한다. 이 문구는 README와도, 같은 페이지의 설명("글 원문과, 한 번이라도 번역된 글의 번역문에서 찾아요.")과도 모순된다.
- 게시판 이름: 44행은 "맛집, 여행, 일자리, 연애"라고 쓰지만 `src/lib/boards.ts`의 실제 이름은 "맛집·음식", "여행·나들이", "일자리·알바", "연애·관계"다.
- "모든 쓰기 동작은 `src/app/actions.ts`"(154행): Server Action 밖에서 일어나는 DB 쓰기가 두 곳 있다. `src/app/(app)/me/page.tsx:17`은 페이지를 렌더링할 때 `UPDATE boundless.users SET seen_at`을 실행한다. `src/app/(app)/search/page.tsx:27`은 렌더링 중에 `track("search")`(`src/lib/db.ts:23`, `INSERT INTO boundless.events`)를 호출한다.
- 폴더 구조 목록(150~158행)에 빠진 항목이 있다.
  - 라우트 `src/app/(app)/boards/`(게시판 목록), `src/app/(app)/report/`(신고), `src/app/api/health/`
  - `src/components/` 전체(13개 파일: `Community.tsx`, `Feed.tsx`, `I18n.tsx`, `forms.tsx`, `ui.tsx` 등)
  - `src/lib/db.ts`(DB 풀, `track` 이벤트 로그), `src/lib/mail.ts`(로그인 코드 메일)
  - `scripts/`(`db.mjs`, `i18n-check.mjs`, `i18n-translate.mjs`), `deploy/`(`boundless.service`, `deploy.sh`)
  - 앞으로 drift 검사를 싸게 하려면 이 경로들을 README에 링크로 추가하는 편이 좋다.
- 탈퇴 정책 문구: 78행은 탈퇴하면 "번역 캐시"도 지운다고 쓰고(코드 `src/app/actions.ts:447`도 그렇게 한다), 80행은 운영 정책 페이지에 "같은 내용으로 안내"한다고 쓴다. 하지만 `src/app/(app)/policy/page.tsx:61`의 문구는 계정, 글과 댓글, 신고·재심 기록만 나열하고 번역 캐시는 빠져 있다.
- 개발 모드 로그인 코드: 139행은 `EMAIL_SENDER`가 비어 있으면 코드를 "화면에" 보여 준다고 쓰고, `src/lib/mail.ts`도 코드를 반환해 화면에 띄운다. 그런데 132행이 안내하는 `.env.example`의 주석은 "Empty in dev = code printed to the console"이라고만 쓴다. 실제로는 콘솔 출력과 화면 표시를 둘 다 한다.
- `MYMEMORY_EMAIL`: 167행이 이 변수를 언급하고 `src/lib/translate.ts`에서도 쓰지만, 로컬 실행 절차가 복사해 쓰라고 안내하는 `.env.example`에는 이 변수가 없다.

## AGENTS.md

No drift detected

## docs/DEPLOY.md

- 출시 전 체크리스트 152행: P01~P04 임시값을 "코드에서 `ponytail:` 주석으로 검색"하라고 쓴다. 실제로 정책 ID가 붙은 `ponytail:` 주석은 P01(`src/app/actions.ts:94`)과 P02(`src/app/actions.ts:423`) 두 개뿐이다. P03(재심, `appeal`/`resolveAppeal`)과 P04(탈퇴 데이터, `deleteAccount`)에는 이 주석이 없어서 검색으로 찾을 수 없다.
- 51행의 시연 데이터 삭제 SQL `DELETE FROM boundless.users WHERE email LIKE '%@example.com'`: FK cascade로 글, 댓글, 신고, 재심, 좋아요, 저장은 지워진다. 하지만 `boundless.translations`에는 FK가 없다(`item = 'p:<id>'`/`'c:<id>'` 키). 그래서 시드 글의 번역 캐시는 고아 행으로 남는다. 앱의 탈퇴 처리(`src/app/actions.ts:447`)는 이 문제 때문에 번역부터 따로 지우는데, 이 SQL에는 그 단계가 없다.
- 운영 DB 위치: 5~10행 표는 운영 DB를 Neon, oracle_vm을 샘플 DB로 정리한다. 반면 `.env.example`의 첫 주석은 "Production: oracle_vm, schema \"boundless\", role \"boundless\""라고 쓴다.
- 환경변수 표 누락: Vercel 표(32~38행)와 VM 표(98~103행) 모두 `MYMEMORY_EMAIL`(`src/lib/translate.ts`, 번역 일일 한도 확대)이 없다. VM 표에는 `DEMO_LOGIN`도 없다.
- `DEMO_LOGIN` 설명(36행)은 샘플 계정이 이 변수를 켰을 때만 동작하는 것처럼 읽힌다. 실제로 `src/lib/auth.ts:79`의 `demoEnabled()`는 `NODE_ENV !== "production"`이면 항상 켜진다. 문서가 다루는 production에는 영향이 없지만, VM으로 옮길 때 `NODE_ENV`를 빠뜨리면 샘플 로그인이 열린다.

---

# Bootstrap 계약 README drift (egm-bootstrap 후속)

`/egm:egm-bootstrap src`가 생성한 README 24개를, 생성 과정을 모르는 새 에이전트 3개가 코드와 대조한 결과다.

## src/README.md

- Global Invariants: "Demo `@example.com` accounts never get admin rights". `isDemoEmail` is true only when `DEMO_LOGIN=1` (lib/auth.ts:76). Without that flag, demo login still works outside production (lib/auth.ts:79), and an `@example.com` account listed in `ADMIN_EMAILS` gets admin rights. The e2e flow depends on this (`admin@example.com`, e2e/flow.mjs:4,150).
- Global Invariants: "Viewer-aware queries … hide blocked accounts". `getPost` does not hide a blocked author's post. It returns it with a `blocked` flag (lib/posts.ts:147). `savedPosts` and `myPosts` do not apply `NOT_BLOCKED` (lib/posts.ts:132-141).
- Global Invariants: "Ids must match `/^\d{1,18}$/` before they reach SQL". `setDeal` (app/actions.ts:235) and `toggleSolved` (app/actions.ts:293) pass `str(f, "post")` to SQL without an `isId` check.
- Global Invariants: "Owner-only writes scope SQL to `user_id` (… `appeal`)". `appeal` checks ownership in app code (app/actions.ts:372), and its INSERT has no `user_id` predicate (app/actions.ts:375).
- Overview: "server components take a `t: T` prop". `Icon`, `LangMenu`, and several `ui.tsx` primitives take no `t` (components/Icon.tsx:50, components/LangMenu.tsx:9).
- System Verification: the e2e flow does not need a seeded database, because it creates its own users and posts (e2e/flow.mjs:25-131). It does need dev-mail mode with `EMAIL_SENDER` unset and `ADMIN_EMAILS` including `admin@example.com` (e2e/flow.mjs:1-4), and the README leaves both out.

## src/app/README.md

- "Demo `@example.com` accounts are never admins" and "demo addresses get `devCode`" are true only when `DEMO_LOGIN=1` (src/lib/auth.ts:76, :84; actions.ts:67). The README also leaves out a second `devCode` path: outside production without SMTP, `sendCodeMail` returns the code for every address (src/lib/mail.ts:11-14). In production without SMTP it throws (actions.ts:71-73).
- "Other in-place mutations call `refresh()`" is wrong for two actions: `reportContent` (actions.ts:349-365) and `setLang` (actions.ts:123-126) do not call it.
- Omitted moderation behavior: `moderate` resolves every open report on the same target, setting `actioned` or `dismissed`, and `hide` sets `hidden` (actions.ts:471-477). `resolveAppeal` changes only `received` appeals, and `restore` un-hides the content (actions.ts:393-397).
- Side Effects: `boundless.login_codes` is missing, though `sendCode`/`verifyCode` write it through `issueCode`/`consumeCode` (src/lib/auth.ts:105-129).

## src/app/login/README.md

- The culture order does not fall through. Any non-empty param or cookie value, even an unknown code, goes to `cultureOf` and becomes `XX`, and `Accept-Language` is never checked (src/app/login/page.tsx:22-23; src/lib/cultures.ts:360-361).

## src/app/api/README.md

No drift detected

## src/app/api/health/README.md

No drift detected

## src/app/(app)/README.md

- The nav list leaves out the `/write` button (layout.tsx:51-54), the `/policy` footer link (layout.tsx:69-74), and the logo targets: `/?intro=1` on desktop (layout.tsx:47) and `/feed` in the phone header (layout.tsx:113).
- "Each child directory is one route" is wrong for `b/` and `posts/`. They hold only dynamic segments, and `posts/` holds two routes.
- `ErrorPage` reads only `reset`. The `error` prop is typed but never shown (error.tsx:5).

## src/app/(app)/admin/README.md

- `moderate` hides the target only for `action=hide`. With `dismiss`, open reports become `dismissed` (src/app/actions.ts:471-477).
- Not mentioned: the appeals section renders only when there are open appeals (admin/page.tsx:70), and an empty report list shows a `Notice` (admin/page.tsx:108). The nationality shown is the appellant's on appeal rows (admin/page.tsx:52) and the content author's on report rows (admin/page.tsx:40).

## src/app/(app)/b/README.md

No drift detected

## src/app/(app)/b/[board]/README.md

- Side Effects lists only `listPosts`. `WithRail` always renders `RightRail` (hidden by CSS only), which runs `ranking(5)`, `myPoints`, `listPosts({ waiting: true, limit: 3 })`, `hotPosts`, and `recentActivity(viewer, 4)` (src/components/Community.tsx:16-37).
- The write button carries the active tag: `/write?board=<id>&kind=<tag>` (b/[board]/page.tsx:41).

## src/app/(app)/boards/README.md

No drift detected

## src/app/(app)/feed/README.md

- Side Effects leaves out the `RightRail` reads (feed/page.tsx:30, src/components/Community.tsx:31-37).
- The board shortcuts are phone and tablet only (`lg:hidden`, feed/page.tsx:87).

## src/app/(app)/guide/README.md

- `APPS` render as plain list items, not `HelpItem` (guide/page.tsx:39-43).
- `getLang` falls back to the member's culture language through `getUser()` (a DB read) before it checks `Accept-Language` (src/lib/auth.ts:132-138).

## src/app/(app)/lounge/README.md

- Side Effects leaves out the `RightRail` reads (lounge/page.tsx:40).
- The member count shown is clamped to at least 1 (lounge/page.tsx:37).

## src/app/(app)/me/README.md

- The "mine" tab includes the member's hidden posts, shown dimmed with an appeal link (src/lib/posts.ts:132-134; me/page.tsx:68-77). The saved tab excludes hidden posts (src/lib/posts.ts:139).
- `newReplies` returns at most 20 rows (src/lib/posts.ts:176), but `seen_at = now()` marks every newer reply as read, including any beyond those 20 (me/page.tsx:17).
- The `/write` link shows only on the "mine" tab (me/page.tsx:59-64).

## src/app/(app)/policy/README.md

- `completeSignup` does not check an age. It only rejects signups where the `agreed` checkbox is false (src/app/actions.ts:95).
- "One appeal per item" is enforced by the partial unique indexes `appeals_post_once`/`appeals_comment_once` (db/schema.sql:161-162). The action uses `ON CONFLICT DO NOTHING` (src/app/actions.ts:375).

## src/app/(app)/posts/README.md

No drift detected

## src/app/(app)/posts/[id]/README.md

- The language check applies to the post body only (posts/[id]/page.tsx:61,118). Every comment gets a `Translatable` (posts/[id]/page.tsx:279), and translation runs only on click (src/components/Translate.tsx:33-37).
- Not mentioned: report links for signed-in non-authors (posts/[id]/page.tsx:183-188, 304-309).
- Side Effects leaves out the `RightRail` reads (posts/[id]/page.tsx:246-249).
- For signed-out visitors, only the helpful pill and the comment box become sign-in links. Save is hidden, and comment likes show a plain count (posts/[id]/page.tsx:166-171, 238-242, 294-298).
- Comments by blocked authors are left out entirely, from both the thread and the count (src/lib/posts.ts:162).

## src/app/(app)/posts/[id]/edit/README.md

- The page does not check `post.hidden`, so the author can edit a hidden post. It stays hidden (edit/page.tsx:16-17; src/app/actions.ts:192-198).
- The board cannot be changed on edit. There is no `changeHref`, and the board is a hidden input (edit/page.tsx:22-41).

## src/app/(app)/report/README.md

No drift detected

## src/app/(app)/search/README.md

- Results come from the `global` space only, so lounge posts never match (src/lib/posts.ts:101).
- `q` also matches cached translations (src/lib/posts.ts:105-109).
- When there are no results, a link goes to `/write?title=<q>&board=<board>` (search/page.tsx:122).
- `track("search")` fires on every render with `q`, including "load more" pages (search/page.tsx:27).

## src/app/(app)/settings/README.md

- Not mentioned: the private login email is shown to the member (settings/page.tsx:101-104). There is a `/policy` link (settings/page.tsx:136-138). "Unblock all" renders only when the blocked count is above 0 (settings/page.tsx:129-133). The rules `<details>` is shown to visitors too (settings/page.tsx:41-49).

## src/app/(app)/write/README.md

- "None on render" misses the `localStorage` draft `draft:<space>:<board>` (src/components/forms.tsx:52-80; write/page.tsx:96).
- Not mentioned: a "change board" link back to `/write` (write/page.tsx:91). `space=lounge` overrides `board` (write/page.tsx:74).

## src/components/README.md

- Not every server component takes `t: T`: `Icon` (Icon.tsx:50), `LangMenu` (LangMenu.tsx:9-25), and many `ui.tsx` primitives (ui.tsx:32-213) take none.
- `AccountSwitcher` only changes the avatar and the "current" check (Community.tsx:237). It posts `"XX"`, and the XX→CA mapping happens in `demoLogin` (app/actions.ts:109).
- `CHROME_PATH` is optional for e2e. It has a default macOS path (e2e/flow.mjs:10).

## src/lib/README.md

- The 400-byte translation chunk is a threshold, but the cut point uses character indices (translate.ts:17). Multibyte text can produce chunks of about 600 bytes, which is over the 500-byte API limit (translate.ts:11).
- "Tables read" leaves out `boundless.translations`. Search reads it (posts.ts:107), and `translateItem` reads it as a cache (translate.ts:55).
