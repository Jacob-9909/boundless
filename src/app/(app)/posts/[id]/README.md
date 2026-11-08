# posts/[id]

## Overview

`/posts/[id]`: one post with its comments. It shows the body with on-demand
translation, the action bar (helpful, save, solved, share), marketplace deal
controls, the comment thread with one level of replies, official help links for
the board, and the author's edit and delete tools.

## Interface

- `page.tsx`: `PostPage` (default export). There is no `metadata` export.
  - Reads route param `id`.
  - Local components `Comment` (one comment with like, translate, report or delete)
    and `DeleteOwn` (confirm-and-delete form posting `post` or `comment`).
  - Server actions wired into forms: `toggleLike` (`post` or `comment`), `toggleSave`
    (`post`), `toggleSolved` (`post`, author only, when the tag `asks`), `acceptAnswer`
    (`post`, `comment`, author only, when the tag `asks`, on top-level replies by others), `setDeal`
    (`post`, `deal`, author only, market boards), `addComment` through
    `CommentForm` (bound to `post.id`, optional `parent`), `deleteOwn`. `AppealForm`
    (calls `appeal`) appears on hidden content the viewer owns.
  - `Translatable` (`kind` `p` or `c`) calls the `translate` action when the post
    language differs from the viewer's reading language (`readLangOf`).
- Subdirectory:
  - [`edit`](./edit/README.md): `/posts/[id]/edit`, the author's edit form.

## Invariants

- `notFound()` when `id` fails `isId`, or when `getPost` returns nothing (`page.tsx:PostPage`).
- The accepted reply (`post.accepted_comment_id`) is listed first among top-level comments
  and carries an "accepted answer" badge (`data-accepted`). `post.visa` shows as a header tag.
- Lounge posts (`post.space !== "global"`) render only an access notice unless the
  viewer's nationality equals `post.space`.
- Hidden posts and posts by blocked authors render only a notice; the author of a
  hidden post gets `AppealForm` there.
- Hidden comments render as a placeholder; their author gets `AppealForm`.
- Comments are fetched alongside the post but rendered only after the checks above pass.
- Replies are grouped under their top-level `parent_id`; the comment count excludes hidden comments.
- Signed-out visitors see sign-in links to `/login?next=/posts/<id>` instead of action forms.

## Side Effects

- Reads `getPost(viewerId, id)` and `getComments(viewerId, id)` (`src/lib/posts.ts`).
- Form submissions run the server actions above (`../../../actions.ts`), which write
  `boundless.post_likes`, `comment_likes`, `saves`, `posts`, `comments`, `appeals`,
  or `translations`, then call `refresh()` or redirect (deleting the post redirects to `/me`).

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run e2e` (needs a running server; see the header of `e2e/flow.mjs`)
