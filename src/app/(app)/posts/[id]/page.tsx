import Link from "next/link";
import { notFound } from "next/navigation";
import { addComment, deleteOwn, setDeal, toggleLike, toggleSave, toggleSolved } from "@/app/actions";
import { CommentForm } from "@/components/forms";
import { Icon } from "@/components/Icon";
import { RightRail } from "@/components/Community";
import { Translatable } from "@/components/Translate";
import { Avatar, BackLink, BoardBadge, EventLine, Flag, HelpItem, LevelBadge, MarketLine, NationalityChip, Notice, TagText, pill, tag } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { boardOf, DEALS } from "@/lib/boards";
import { helpFor } from "@/lib/guide";
import { countryName, langName, readLangOf, regionLabel, timeAgo, type Lang, type T } from "@/lib/i18n";
import { getComments, getPost, type CommentRow } from "@/lib/posts";

export default async function PostPage(props: PageProps<"/posts/[id]">) {
  const { id } = await props.params;
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  const post = await getPost(user?.id ?? null, id);
  if (!post) notFound();

  // Country lounges are private to members of that nationality.
  if (post.space !== "global" && post.space !== user?.nationality) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:pt-8">
        <Notice label={t("접근 제한")} title={t("{country} 이웃만 볼 수 있는 라운지 글이에요", { country: countryName(post.space, lang) })}>
          <Link href="/feed" className="font-bold text-primary underline">
            {t("피드로 돌아가기")}
          </Link>
        </Notice>
      </div>
    );
  }

  if (post.hidden || post.blocked) {
    return (
      <div className="p-4">
        <Notice label={t("접근 제한")} title={post.hidden ? t("운영 정책에 따라 가려진 글이에요") : t("차단한 계정의 글이에요")}>
          <Link href="/feed" className="font-bold text-primary underline">
            {t("피드로 돌아가기")}
          </Link>
        </Notice>
      </div>
    );
  }

  const comments = await getComments(user?.id ?? null, id);
  const top = comments.filter((c) => !c.parent_id);
  const repliesOf = (cid: string) => comments.filter((c) => c.parent_id === cid);
  const help = helpFor(post.topic);
  const reply = addComment.bind(null, post.id);
  const signIn = `/login?next=/posts/${post.id}`;
  const board = boardOf(post.topic);
  const lounge = post.space !== "global";
  const readLang = readLangOf(user, lang);
  const target = langName(readLang, lang).split(" · ")[0];
  const canTranslate = post.lang !== readLang;
  const asks = board.tags.find((x) => x.id === post.kind)?.asks;

  return (
    <div className="grid gap-6 md:px-2 xl:grid-cols-[minmax(0,1fr)_320px] xl:px-6">
      <article className="min-w-0 pb-6">
        <BackLink href={lounge ? "/lounge" : `/b/${post.topic}`} label={lounge ? t("{country} 라운지", { country: countryName(post.space, lang) }) : t(board.ko)} />
        <header className="relative overflow-hidden bg-soft px-5 pt-5 pb-6 md:mx-4 md:rounded-3xl md:px-7">
          <span
            className="bg-pattern absolute inset-y-0 right-0 w-1/3 opacity-25 [mask-image:linear-gradient(to_left,black,transparent)]"
            style={{ backgroundColor: "var(--c-primary)" }}
            aria-hidden="true"
          />
          <div className="relative flex flex-wrap gap-1.5">
            {lounge ? (
              <span className={`${tag} bg-ink text-white`}>
                <Flag code={post.space} h={10} />
                {t("라운지")}
              </span>
            ) : (
              <BoardBadge id={post.topic} t={t} href={`/b/${post.topic}`} />
            )}
            {post.region && (
              <span className={`${tag} bg-white/70`}>
                <Icon name="pin" size={12} />
                {regionLabel(post.region, t)}
              </span>
            )}
            {post.solved && (
              <span className={`${tag} bg-emerald-700 text-white`}>
                <Icon name="check" size={12} />
                {t("해결됨")}
              </span>
            )}
          </div>
          <h1 className="relative mt-3 font-display text-2xl leading-tight font-extrabold tracking-tight [overflow-wrap:anywhere] md:text-[32px]">
            <TagText board={post.topic} tagId={post.kind} t={t} />
            {post.title}
          </h1>
          {(board.extra === "market" || board.extra === "event") && (
            <div className="relative mt-3">{board.extra === "market" ? <MarketLine post={post} t={t} /> : <EventLine post={post} t={t} />}</div>
          )}
          <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs">
            <Avatar code={post.nationality} size={32} />
            <NationalityChip code={post.nationality} lang={lang} prefix={t("글쓴이")} />
            <LevelBadge points={post.points} t={t} />
            <span className="opacity-70">
              {timeAgo(post.created_at, lang)}
              {post.updated_at && ` · ${t("수정됨")}`}
            </span>
          </div>
        </header>

        <div className="px-4 py-5">
          <p className={`${tag} mb-3 bg-ink/5`}>
            {t("원문")} · {langName(post.lang, lang)}
          </p>
          {canTranslate ? (
            <Translatable kind="p" id={post.id} body={post.body} target={target} className="text-base leading-[1.75] whitespace-pre-wrap [overflow-wrap:anywhere]" />
          ) : (
            <div className="text-base leading-[1.75] whitespace-pre-wrap [overflow-wrap:anywhere]">{post.body}</div>
          )}
          {post.mine && board.extra === "market" && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-paper p-3 text-sm">
              <span className="font-bold">{t("거래 상태")}</span>
              {DEALS.map((d) => (
                <form key={d.id} action={setDeal}>
                  <input type="hidden" name="post" value={post.id} />
                  <input type="hidden" name="deal" value={d.id} />
                  <button aria-pressed={post.deal === d.id} className={`${pill} ${post.deal === d.id ? "border-primary bg-primary text-paper" : "border-ink/15 bg-white"}`}>
                    {t(d.ko)}
                  </button>
                </form>
              ))}
            </div>
          )}

          {/* Action bar: helpful, save, solved — then author or reader tools */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {user ? (
              <>
                <form action={toggleLike}>
                  <input type="hidden" name="post" value={post.id} />
                  <button aria-pressed={post.liked} className={`${pill} ${post.liked ? "border-primary bg-primary text-paper" : "border-ink/15 bg-white"}`}>
                    <Icon name="helpful" size={16} filled={post.liked} />
                    {t("도움돼요")} {post.likes}
                  </button>
                </form>
                <form action={toggleSave}>
                  <input type="hidden" name="post" value={post.id} />
                  <button aria-pressed={post.saved} className={`${pill} ${post.saved ? "border-primary bg-soft text-primary" : "border-ink/15 bg-white"}`}>
                    <Icon name="bookmark" size={16} filled={post.saved} />
                    {post.saved ? t("저장됨") : t("저장")}
                  </button>
                </form>
                {post.mine && asks && (
                  <form action={toggleSolved}>
                    <input type="hidden" name="post" value={post.id} />
                    <button className={`${pill} border-emerald-700/40 bg-white text-emerald-800`}>
                      <Icon name="check" size={16} />
                      {post.solved ? t("다시 질문 중으로") : t("해결됐어요")}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <Link href={signIn} className={`${pill} border-ink/15 bg-white`}>
                <Icon name="helpful" size={16} />
                {t("도움돼요")} {post.likes}
              </Link>
            )}
            <span className="ml-auto flex items-center gap-3 text-xs">
              {post.mine && (
                <>
                  <Link href={`/posts/${post.id}/edit`} className="inline-flex items-center gap-1 font-semibold opacity-60 hover:underline">
                    <Icon name="edit" size={14} />
                    {t("수정")}
                  </Link>
                  <DeleteOwn name="post" id={post.id} label={t("글 삭제")} confirm={t("댓글까지 모두 지워져요. 삭제할까요?")} yes={t("삭제")} />
                </>
              )}
              {user && !post.mine && (
                <Link href={`/report?post=${post.id}`} className="inline-flex items-center gap-1 font-semibold opacity-60 hover:underline">
                  <Icon name="flag" size={14} />
                  {t("신고")}
                </Link>
              )}
            </span>
          </div>
        </div>

        {help.length > 0 && (
          <aside className="mx-4 rounded-2xl bg-soft/50 p-4">
            <p className="text-sm font-bold">{t("공식 안내도 함께 확인하세요")}</p>
            <ul className="mt-2 space-y-2">
              {help.map((h) => (
                <li key={h.tel ?? h.url}>
                  <HelpItem h={h} t={t} />
                </li>
              ))}
            </ul>
          </aside>
        )}

        <section className="mt-2 border-t border-ink/10 px-4 py-5">
          <h2 className="font-display text-lg font-extrabold">{t("댓글 {n}", { n: comments.filter((c) => !c.hidden).length })}</h2>
          <ul className="mt-3 space-y-3">
            {top.map((c) => (
              <li key={c.id}>
                <Comment c={c} postId={post.id} t={t} lang={lang} signedIn={!!user} target={target} />
                {(repliesOf(c.id).length > 0 || user) && (
                  <div className="mt-2 ml-5 space-y-2 border-l-2 border-ink/10 pl-3">
                    {repliesOf(c.id).map((r) => (
                      <Comment key={r.id} c={r} postId={post.id} t={t} lang={lang} signedIn={!!user} target={target} />
                    ))}
                    {user && !c.hidden && (
                      <details>
                        <summary className="inline-flex h-8 cursor-pointer list-none items-center gap-1 text-xs font-bold text-primary">
                          <Icon name="reply" size={14} />
                          {t("답글")}
                        </summary>
                        <div className="mt-2">
                          <CommentForm action={reply} parent={c.id} />
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {!comments.length && <p className="mt-2 text-sm opacity-70">{t("아직 답변이 없어요. 경험이 있다면 먼저 남겨 주세요.")}</p>}

          <div className="mt-5">
            {user ? (
              <CommentForm action={reply} />
            ) : (
              <Link href={signIn} className="text-sm font-bold text-primary underline">
                {t("로그인하고 댓글 달기")}
              </Link>
            )}
          </div>
        </section>
      </article>
      <aside className="hidden pt-16 xl:block">
        <div className="sticky top-6">
          <RightRail viewer={user?.id ?? null} lang={lang} t={t} />
        </div>
      </aside>
    </div>
  );
}

function Comment({ c, postId, t, lang, signedIn, target }: { c: CommentRow; postId: string; t: T; lang: Lang; signedIn: boolean; target: string }) {
  if (c.hidden) return <p className="rounded-xl bg-white p-3.5 text-sm italic opacity-60">{t("운영 정책에 따라 가려진 댓글이에요")}</p>;
  return (
    <div
      data-comment
      className={`flex gap-3 rounded-2xl border-l-4 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)] ${c.anon_no === 0 ? "border-primary" : "border-transparent"}`}
    >
      <Avatar code={c.nationality} size={34} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold" data-handle>
            {c.anon_no === 0 ? t("글쓴이") : t("이웃 {n}", { n: c.anon_no })}
          </span>
          <NationalityChip code={c.nationality} lang={lang} />
          <LevelBadge points={c.points} t={t} />
          <span className="opacity-60">{timeAgo(c.created_at, lang)}</span>
        </div>
        <div className="mt-1.5">
          <Translatable kind="c" id={c.id} body={c.body} target={target} small className="text-[15px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]" />
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-xs">
          {signedIn ? (
            <form action={toggleLike}>
              <input type="hidden" name="comment" value={c.id} />
              <button
                aria-pressed={c.liked}
                aria-label={`${t("도움돼요")} ${c.likes}`}
                className={`-ml-1 inline-flex h-8 items-center gap-1 rounded-full px-1.5 font-semibold ${c.liked ? "text-primary" : "opacity-60"}`}
              >
                <Icon name="helpful" size={15} filled={c.liked} />
                {c.likes}
              </button>
            </form>
          ) : (
            <span className="inline-flex h-8 items-center gap-1 opacity-60">
              <Icon name="helpful" size={15} />
              {c.likes}
            </span>
          )}
          <span className="ml-auto">
            {c.mine ? (
              <DeleteOwn name="comment" id={c.id} label={t("삭제")} confirm={t("이 댓글을 삭제할까요?")} yes={t("삭제")} />
            ) : (
              signedIn && (
                <Link href={`/report?comment=${c.id}&post=${postId}`} className="inline-flex items-center gap-1 opacity-50 hover:underline">
                  <Icon name="flag" size={13} />
                  {t("신고")}
                </Link>
              )
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Two-step delete without JavaScript: open, then confirm. */
function DeleteOwn({ name, id, label, confirm, yes }: { name: "post" | "comment"; id: string; label: string; confirm: string; yes: string }) {
  return (
    <details className="inline-block text-xs">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-semibold opacity-60 hover:underline">
        <Icon name="trash" size={14} />
        {label}
      </summary>
      <form action={deleteOwn} className="mt-1 flex items-center gap-2">
        <input type="hidden" name={name} value={id} />
        <span className="opacity-80">{confirm}</span>
        <button className="rounded bg-red-700 px-2 py-1 font-bold text-white">{yes}</button>
      </form>
    </details>
  );
}
