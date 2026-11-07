import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Notice, PageHead, PostCard, SignInRequired, btn } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { timeAgo } from "@/lib/i18n";
import { myPosts, newReplies, savedPosts } from "@/lib/posts";

export const metadata = { title: "My posts" };

export default async function MePage(props: PageProps<"/me">) {
  const tab = (await props.searchParams).tab === "saved" ? "saved" : "mine";
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  if (!user) return <SignInRequired t={t} next="/me" />;
  const [posts, fresh] = await Promise.all([tab === "saved" ? savedPosts(user.id) : myPosts(user.id), newReplies(user.id, user.seen_at)]);
  // Opening this page counts as reading the new replies (clears the nav badge).
  if (fresh.length) await q("UPDATE boundless.users SET seen_at = now() WHERE id = $1", [user.id]);

  const tabCls = (on: boolean) =>
    `flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition ${on ? "bg-white text-ink shadow-sm" : "text-ink/75 hover:text-ink"}`;

  return (
    <div className="mx-auto max-w-3xl lg:ml-2 pb-6">
      <PageHead line="LINE 04 · MY POSTS" title={t("내 글")} desc={t("나만 볼 수 있는 목록이에요. 글을 열어 답변을 확인하세요.")} />
      <div className="space-y-4 px-4 py-4">
        {fresh.length > 0 && (
          <section className="rounded-2xl border-l-4 border-alert bg-white p-4">
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
          </section>
        )}

        <div className="flex gap-1 rounded-2xl bg-ink/[.06] p-1">
          <Link href="/me" className={tabCls(tab === "mine")} aria-current={tab === "mine" ? "page" : undefined}>
            {t("내가 쓴 글")}
          </Link>
          <Link href="/me?tab=saved" className={tabCls(tab === "saved")} aria-current={tab === "saved" ? "page" : undefined}>
            <Icon name="bookmark" size={15} />
            {t("저장한 글")}
          </Link>
        </div>

        {tab === "mine" && (
          <Link href="/write" className={btn}>
            <Icon name="plus" size={18} />
            {t("글쓰기")}
          </Link>
        )}
        {posts.length ? (
          <ul className="space-y-3">
            {posts.map((p) => (
              <li key={p.id} className={p.hidden ? "opacity-70" : ""}>
                <PostCard post={p} lang={lang} t={t} />
                {p.hidden && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs font-semibold text-red-700">
                    {t("운영 정책에 따라 가려진 글이에요")}
                    <Link href={`/posts/${p.id}`} className="inline-flex h-8 items-center text-primary underline">
                      {t("재심 요청·결과 보기")}
                    </Link>
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : tab === "saved" ? (
          <Notice title={t("저장한 글이 없어요")}>{t("글에서 저장을 누르면 여기에 모여요.")}</Notice>
        ) : (
          <Notice title={t("아직 쓴 글이 없어요")}>{t("내 질문과 답변 수가 여기에 표시돼요.")}</Notice>
        )}
      </div>
    </div>
  );
}
