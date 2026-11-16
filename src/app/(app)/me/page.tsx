import Link from "next/link";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { unfollow } from "@/app/actions";
import { RightRail } from "@/components/Community";
import { PostList } from "@/components/Feed";
import { Icon } from "@/components/Icon";
import { NavTabs } from "@/components/NavTabs";
import { Avatar, LevelBadge, Notice, PageHead, PostCard, SignInRequired } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { countryName, timeAgo } from "@/lib/i18n";
import { followedNeighbors, followerCount, listPosts, myPosts, newReplies, savedPosts } from "@/lib/posts";

export const metadata = { title: "My posts" };

export default async function MePage(props: PageProps<"/me">) {
  const sp = await props.searchParams;
  const tab = sp.tab === "saved" || sp.tab === "following" ? sp.tab : "mine";
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  if (!user) return <SignInRequired t={t} next="/me" />;
  const [posts, fresh, followed, followers] = await Promise.all([
    tab === "saved" ? savedPosts(user.id) : tab === "following" ? listPosts(user.id, { following: true }) : myPosts(user.id),
    newReplies(user.id, user.seen_at),
    tab === "following" ? followedNeighbors(user.id) : Promise.resolve([]),
    followerCount(user.id),
  ]);
  // Opening this page counts as reading the new replies (clears the nav badge).
  if (fresh.length) await q("UPDATE boundless.users SET seen_at = now() WHERE id = $1", [user.id]);

  return (
    <div className="mx-auto max-w-3xl lg:ml-2 pb-6">
      <PageHead line="LINE 04 · MY POSTS" title={t("내 글")} desc={t("나만 볼 수 있는 목록이에요. 글을 열어 답변을 확인하세요.")} />
      <div className="space-y-4 px-4 py-4">
        {fresh.length > 0 && (
          <Card className="border-l-4 border-l-alert">
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <Icon name="bell" size={16} className="text-alert" />
              {t("새 답변 {n}개", { n: fresh.length })}
            </p>
            <ul className="mt-2 space-y-2">
              {fresh.map((r) => (
                <li key={r.id}>
                  <Link href={`/posts/${r.post_id}`} className="block text-sm hover:underline">
                    <span className="font-semibold">{r.anon_no === 0 ? t("글쓴이") : t("이웃 {n}", { n: r.anon_no })}</span>
                    <span className="opacity-70">
                      {" "}
                      · {r.title} · {timeAgo(r.created_at, lang)}
                    </span>
                    <span className="block truncate opacity-80">{r.body}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <NavTabs
          label={t("내 글")}
          value={tab}
          layout="fill"
          tabs={[
            { value: "mine", label: t("내가 쓴 글"), href: "/me", icon: <Icon name="file" size={15} /> },
            { value: "saved", label: t("저장한 글"), href: "/me?tab=saved", icon: <Icon name="bookmark" size={15} /> },
            { value: "following", label: t("팔로잉"), href: "/me?tab=following", icon: <Icon name="following" size={15} /> },
          ]}
        />

        {tab === "following" && (
          <Card padding={0} className="overflow-hidden">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-[var(--color-border)] px-4 py-3">
              <h2 className="font-bold">{t("팔로우한 이웃 {n}명", { n: followed.length })}</h2>
              {/* Only a count: who follows whom stays private on an anonymous board. */}
              <p className="text-xs text-[var(--color-text-secondary)]">{t("나를 팔로우하는 이웃 {n}명 · 누가 팔로우하는지는 공개되지 않아요", { n: followers })}</p>
            </div>
            {followed.length > 0 && (
              <ul className="divide-y divide-[var(--color-border)]">
                {followed.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Avatar code={f.nationality} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold">
                        {t("{country} 이웃", { country: countryName(f.nationality, lang) })}
                        <LevelBadge points={f.points} t={t} />
                        <span className="text-xs font-medium opacity-70">{t("글 {n}개", { n: f.posts })}</span>
                      </p>
                      {f.last_post && (
                        <Link href={`/posts/${f.last_post}`} className="block truncate text-xs opacity-80 hover:underline">
                          {f.last_title}
                        </Link>
                      )}
                    </div>
                    <form action={unfollow}>
                      <input type="hidden" name="follow" value={f.id} />
                      <Button type="submit" label={t("팔로우 취소")} variant="secondary" />
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === "mine" && (
          <Button href="/write" label={t("글쓰기")} variant="primary" size="lg" icon={<Icon name="plus" size={18} />} />
        )}
        {posts.length ? (
          <PostList>
            {posts.map((p) => (
              <li key={p.id} className={p.hidden ? "opacity-70" : ""}>
                <PostCard post={p} lang={lang} t={t} />
                {p.hidden && (
                  <p className="flex flex-wrap items-center gap-x-2 px-4 pb-3 text-xs font-semibold text-[var(--color-text-error)] md:px-5">
                    {t("운영 정책에 따라 가려진 글이에요")}
                    <Button href={`/posts/${p.id}`} label={t("재심 요청·결과 보기")} variant="ghost" className="text-primary underline" />
                  </p>
                )}
              </li>
            ))}
          </PostList>
        ) : tab === "saved" ? (
          <Notice title={t("저장한 글이 없어요")}>{t("글에서 저장을 누르면 여기에 모여요.")}</Notice>
        ) : tab === "following" ? (
          <Notice title={followed.length ? t("팔로우한 이웃의 새 글이 아직 없어요") : t("아직 팔로우한 이웃이 없어요")}>
            {t("도움이 된 글 위쪽의 팔로우를 누르면 그 이웃의 새 글이 여기에 모여요.")}
          </Notice>
        ) : (
          <Notice title={t("아직 쓴 글이 없어요")}>{t("내 질문과 답변 수가 여기에 표시돼요.")}</Notice>
        )}
      </div>
      {/* Phones and tablets: my level, rank and the helper ranking live in the rail, which they never see beside the feed. */}
      <div className="px-4 pb-4 xl:hidden">
        <RightRail viewer={user.id} lang={lang} t={t} />
      </div>
    </div>
  );
}
