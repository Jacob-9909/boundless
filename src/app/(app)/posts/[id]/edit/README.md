# posts/[id]/edit

## Overview

`/posts/[id]/edit`: the author's edit form for one post. It reuses `WriteForm`
pre-filled with the stored post and submits to `updatePost`.

## Interface

- `page.tsx`: `EditPage` (default export), `metadata` (title `Edit`).
  - Reads route param `id`.
  - Renders `WriteForm` with `action={updatePost.bind(null, post.id)}`, the post's
    board (`boardOf(post.topic)`), and `space` `lounge` or `global` taken from `post.space`.

## Invariants

- Signed-out visitors get `SignInRequired` with `next=/posts/<id>/edit` (`page.tsx:EditPage`).
- `notFound()` unless `getPost(user.id, id)` returns a post with `mine` true, so only
  the author can open the form (`page.tsx:EditPage`).
- The space is fixed: `updatePost` never updates `space` (`../../../../actions.ts:updatePost`).

## Side Effects

- Reads the post through `getPost` (`src/lib/posts.ts`).
- Submitting runs `updatePost`, which updates `boundless.posts` (scoped to the author),
  deletes cached `boundless.translations` for `p:<id>`, and redirects to `/posts/<id>`.

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run e2e` (needs a running server; see the header of `e2e/flow.mjs`)
