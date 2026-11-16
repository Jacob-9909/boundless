import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { Icon as AstryxIcon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { acceptAnswer, addComment, bumpPost, clearAiVisa, setDeal, toggleFollow, toggleLike, toggleSave, toggleSolved } from "@/app/actions";
import { AiSummary } from "@/components/AiSummary";
import { CommentForm, AppealForm, ViewCount } from "@/components/forms";
import { DeleteButton, ShareButton } from "@/components/Share";
import { Icon } from "@/components/Icon";
import { RightRail } from "@/components/Community";
import { LinkCards, Linkify } from "@/components/RichText";
import { Translatable } from "@/components/Translate";
import { Avatar, BackLink, BoardBadge, EventLine, Flag, HelpItem, LevelBadge, MarketLine, NationalityChip, Notice, SolvedBadge, SolvedNote, TagText } from "@/components/ui";
import { aiEnabled } from "@/lib/ai";
import { getT, getUser } from "@/lib/auth";
import { isId } from "@/lib/db";
import { boardOf, DEALS, tagOf } from "@/lib/boards";
import { alertOf, helpFor, hotline } from "@/lib/guide";
import { countryName, langName, readLangOf, regionLabel, timeAgo, visaLabel, type Lang, type T } from "@/lib/i18n";
import { BUMP_AFTER_H, canBump, getComments, getPost, postImages, type CommentRow } from "@/lib/posts";

export default async function PostPage(props: PageProps<"/posts/[id]">) {
  const { id } = await props.params;
  if (!isId(id)) notFound();
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  // Comments load alongside the post; they are only rendered once the access checks below pass.
  const [post, comments, images] = await Promise.all([getPost(user?.id ?? null, id), getComments(user?.id ?? null, id), postImages(id)]);
  if (!post) notFound();

  // Country lounges are private to members of that nationality.
  if (post.space !== "global" && post.space !== user?.nationality) {
    return (
      <div className="mx-auto max-w-3xl lg:ml-2 p-4 md:pt-8">
        <Notice label={t("접근 제한")} title={t("{country} 이웃만 볼 수 있는 라운지 글이에요", { country: countryName(post.space, lang) })}>
          <Button href="/feed" label={t("피드로 돌아가기")} variant="secondary" />
        </Notice>
      </div>
    );
  }

  if (post.hidden || post.blocked) {
    return (
      <div className="p-4">
        <Notice label={t("접근 제한")} title={post.hidden ? t("운영 정책에 따라 가려진 글이에요") : t("차단한 계정의 글이에요")}>
          {post.hidden && post.mine && <AppealForm post={post.id} status={post.appeal} />}
          <Button href="/feed" label={t("피드로 돌아가기")} variant="secondary" className="mt-3" />
        </Notice>
      </div>
    );
  }

  // The accepted answer leads the thread; the rest keep their order.
  const top = comments.filter((c) => !c.parent_id).sort((a, b) => Number(b.id === post.accepted_comment_id) - Number(a.id === post.accepted_comment_id));
  const replies = Map.groupBy(comments.filter((c) => c.parent_id), (c) => c.parent_id!);
  const repliesOf = (cid: string) => replies.get(cid) ?? [];
  const help = helpFor(post.topic);
  const reply = addComment.bind(null, post.id);
  const signIn = `/login?next=/posts/${post.id}`;
  const board = boardOf(post.topic);
  const lounge = post.space !== "global";
  const readLang = readLangOf(user, lang);
  const target = langName(readLang, lang).split(" · ")[0];
  const canTranslate = post.lang !== readLang;
  const asks = !!tagOf(post.topic, post.kind).asks;
  // The author's unanswered question: offer "ask again" once it has waited long enough.
  const unanswered = post.mine && asks && !post.solved && post.comments === 0;
  const bumpable = canBump(post, asks);

  return (
    <div className="grid gap-6 md:px-2 xl:grid-cols-[minmax(0,1fr)_320px] xl:px-6">
      <article className="min-w-0 pb-6">
        <ViewCount id={post.id} />
        <BackLink href={lounge ? "/lounge" : `/b/${post.topic}`} label={lounge ? t("{country} 라운지", { country: countryName(post.space, lang) }) : t(board.ko)} />
        <header className="relative overflow-hidden bg-soft px-4 pt-4 pb-5 md:mx-4 md:rounded-3xl md:px-7 md:pt-5 md:pb-6">
          <span
            className="bg-pattern absolute inset-y-0 right-0 w-1/3 opacity-25 [mask-image:linear-gradient(to_left,black,transparent)]"
            style={{ backgroundColor: "var(--c-primary)" }}
            aria-hidden="true"
          />
          {/* Chips on the culture banner: white on its soft color, the lounge in the culture's ink. */}
          <div className="relative flex flex-wrap items-center gap-1.5">
            {lounge ? (
              <Badge label={t("라운지")} icon={<Flag code={post.space} h={10} />} className="bg-ink text-white" />
            ) : (
              <BoardBadge id={post.topic} t={t} href={`/b/${post.topic}`} />
            )}
            {post.region && <Badge label={regionLabel(post.region, t)} icon={<Icon name="pin" size={12} />} className="bg-white/70" />}
            {post.visa && <Badge label={visaLabel(post.visa, t)} className="bg-white/70" />}
            {/* The AI tag only when the author did not pick a visa themselves. */}
            {post.ai_visa && !post.visa && (
              <span className="inline-flex items-center">
                <Tooltip content={t("AI가 글에서 읽은 비자 종류예요")}>
                  <Badge
                    label={
                      <>
                        {post.ai_visa} <span className="opacity-60">· AI</span>
                      </>
                    }
                    icon={<Icon name="idcard" size={12} />}
                    className="bg-white/70"
                  />
                </Tooltip>
                {post.mine && (
                  <form action={clearAiVisa} className="inline-flex">
                    <input type="hidden" name="post" value={post.id} />
                    <IconButton type="submit" variant="ghost" label={t("AI가 붙인 비자 태그 지우기")} icon={<AstryxIcon icon="close" size="sm" />} />
                  </form>
                )}
              </span>
            )}
            {post.solved && <SolvedBadge post={post} t={t} />}
            {post.bumped_at && !post.solved && post.comments === 0 && (
              <Badge variant="warning" icon={<Icon name="lift" size={12} />} label={t("도움 요청")} />
            )}
          </div>
          <h1 className="relative mt-2.5 font-display text-[22px] leading-tight font-extrabold tracking-tight [overflow-wrap:anywhere] md:mt-3 md:text-[32px]">
            <TagText board={post.topic} tagId={post.kind} t={t} />
            {post.title}
          </h1>
          {(board.extra === "market" || board.extra === "event") && (
            <div className="relative mt-3">{board.extra === "market" ? <MarketLine post={post} t={t} /> : <EventLine post={post} t={t} />}</div>
          )}
          <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs">
            <Avatar code={post.nationality} size={32} look={post.avatar} />
            <NationalityChip code={post.nationality} lang={lang} prefix={t("글쓴이")} />
            <LevelBadge points={post.points} t={t} />
            {/* Follow a neighbor whose tips keep helping. They only ever see a follower count, never who. */}
            {user && !post.mine && (
              <form action={toggleFollow}>
                <input type="hidden" name="post" value={post.id} />
                <Button
                  type="submit"
                  variant={post.following ? "primary" : "secondary"}
                  aria-pressed={post.following}
                  icon={<Icon name={post.following ? "following" : "follow"} size={14} />}
                  label={post.following ? t("팔로잉") : t("팔로우")}
                  className="rounded-full"
                />
              </form>
            )}
            <span className="opacity-70">
              {timeAgo(post.created_at, lang)}
              {post.updated_at && ` · ${t("수정됨")}`}
            </span>
            <span className="inline-flex items-center gap-1 opacity-70">
              <Icon name="eye" size={13} />
              {t("조회 {n}", { n: post.views })}
            </span>
          </div>
        </header>
        {post.mine && post.alert && <AlertCard id={post.alert} t={t} />}

        <div className="px-4 py-5">
          {/* The text in its own card, so it reads apart from the header, the tools and the replies. */}
          <section aria-label={t("본문")}>
            <Card>
              <p className="mb-3">
                <Badge label={`${t("원문")} · ${langName(post.lang, lang)}`} />
              </p>
              {canTranslate ? (
                <Translatable kind="p" id={post.id} body={post.body} target={target} className="text-base leading-[1.75] whitespace-pre-wrap [overflow-wrap:anywhere]" />
              ) : (
                <div className="text-base leading-[1.75] whitespace-pre-wrap [overflow-wrap:anywhere]">
                  <Linkify text={post.body} />
                </div>
              )}
              {images.length > 0 && (
                <ul className={`mt-5 grid gap-2 ${images.length > 1 ? "grid-cols-2" : ""}`}>
                  {images.map((im, i) => (
                    <li key={im.id}>
                      <a href={`/api/img/${im.id}`} target="_blank" className="relative block aspect-[4/3] overflow-hidden rounded-[var(--radius-element)] bg-[var(--color-background-muted)] ring-1 ring-[var(--color-border)]">
                        <Image
                          src={`/api/img/${im.id}`}
                          alt={t("첨부 사진 {n}", { n: i + 1 })}
                          fill
                          unoptimized
                          className={images.length > 1 ? "object-cover" : "object-contain"}
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <LinkCards text={post.body} label={t("첨부 링크")} />
            </Card>
          </section>
          {post.solved && <SolvedNote post={post} lang={lang} t={t} />}
          {post.solved && aiEnabled() && comments.some((c) => c.anon_no !== 0 && !c.hidden) && <AiSummary postId={post.id} />}
          {unanswered && (
            <div className="mt-4">
              <Banner
                status="warning"
                collapsible={false}
                icon={<Icon name="lift" size={20} />}
                title={
                  bumpable
                    ? t("아직 답변이 없어요. 도움을 요청하면 이 글이 목록 맨 위로 다시 올라가요.")
                    : t("{h}시간 동안 답변이 없으면 도움 요청으로 이 글을 목록 맨 위에 다시 올릴 수 있어요.", { h: BUMP_AFTER_H })
                }
                endContent={
                  bumpable ? (
                    <form action={bumpPost}>
                      <input type="hidden" name="post" value={post.id} />
                      <Button type="submit" variant="primary" icon={<Icon name="lift" size={16} />} label={t("도움 요청")} />
                    </form>
                  ) : undefined
                }
              />
            </div>
          )}
          {post.mine && board.extra === "market" && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[var(--radius-container)] bg-paper p-3 text-sm">
              <span className="font-bold">{t("거래 상태")}</span>
              {DEALS.map((d) => (
                <form key={d.id} action={setDeal}>
                  <input type="hidden" name="post" value={post.id} />
                  <input type="hidden" name="deal" value={d.id} />
                  <Button type="submit" variant={post.deal === d.id ? "primary" : "secondary"} aria-pressed={post.deal === d.id} label={t(d.ko)} className="rounded-full" />
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
                  <Button
                    type="submit"
                    variant={post.liked ? "primary" : "secondary"}
                    aria-pressed={post.liked}
                    icon={<Icon name="helpful" size={16} filled={post.liked} />}
                    label={`${t("도움돼요")} ${post.likes}`}
                    className="rounded-full"
                  />
                </form>
                <form action={toggleSave}>
                  <input type="hidden" name="post" value={post.id} />
                  {/* Saved shows as a filled bookmark in the member's color, so it does not compete with a pressed 도움돼요. */}
                  <Button
                    type="submit"
                    variant="secondary"
                    aria-pressed={post.saved}
                    icon={<Icon name="bookmark" size={16} filled={post.saved} className={post.saved ? "text-primary" : ""} />}
                    label={post.saved ? t("저장됨") : t("저장")}
                    className={`rounded-full ${post.saved ? "text-primary" : ""}`}
                  />
                </form>
                {post.mine && asks && (
                  <form action={toggleSolved}>
                    <input type="hidden" name="post" value={post.id} />
                    <Button
                      type="submit"
                      variant="secondary"
                      icon={<Icon name="check" size={16} />}
                      label={post.solved ? t("다시 질문 중으로") : t("해결됐어요")}
                      className="rounded-full text-[var(--color-text-success)]"
                    />
                  </form>
                )}
              </>
            ) : (
              <Button href={signIn} variant="secondary" icon={<Icon name="helpful" size={16} />} label={`${t("도움돼요")} ${post.likes}`} className="rounded-full" />
            )}
            <ShareButton title={post.title} className="rounded-full" />
            <span className="ml-auto flex items-center gap-1">
              {post.mine && (
                <>
                  <Button href={`/posts/${post.id}/edit`} variant="ghost" icon={<Icon name="edit" size={14} />} label={t("수정")} />
                  <DeleteButton name="post" id={post.id} label={t("글 삭제")} confirm={t("댓글까지 모두 지워져요. 삭제할까요?")} yes={t("삭제")} />
                </>
              )}
              {user && !post.mine && (
                <Button href={`/report?post=${post.id}`} variant="ghost" icon={<Icon name="siren" size={14} className="text-[var(--color-icon-error)]" />} label={t("신고")} />
              )}
            </span>
          </div>
        </div>

        {help.length > 0 && (
          <section className="mx-4 rounded-[var(--radius-container)] bg-soft/50 p-4">
            <p className="text-sm font-bold">{t("공식 안내도 함께 확인하세요")}</p>
            <ul className="mt-2 space-y-2">
              {help.map((h) => (
                <li key={h.tel ?? h.url}>
                  <HelpItem h={h} t={t} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-2 border-t border-[var(--color-border)] px-4 py-5">
          <h2 className="font-display text-lg font-extrabold">{t("댓글 {n}", { n: comments.filter((c) => !c.hidden).length })}</h2>
          <ul className="mt-3 space-y-3">
            {top.map((c) => (
              <li key={c.id}>
                <Comment
                  c={c}
                  postId={post.id}
                  t={t}
                  lang={lang}
                  signedIn={!!user}
                  target={target}
                  accepted={c.id === post.accepted_comment_id}
                  canAccept={post.mine && asks && c.anon_no !== 0}
                />
                {(repliesOf(c.id).length > 0 || user) && (
                  <div className="mt-2 ml-5 space-y-2 border-l-2 border-[var(--color-border)] pl-3">
                    {repliesOf(c.id).map((r) => (
                      <Comment key={r.id} c={r} postId={post.id} t={t} lang={lang} signedIn={!!user} target={target} />
                    ))}
                    {user && !c.hidden && (
                      <Collapsible
                        defaultIsOpen={false}
                        trigger={
                          <span className="inline-flex min-h-10 items-center gap-1 text-[13px] font-bold text-primary pointer-coarse:min-h-11">
                            <Icon name="reply" size={14} />
                            {t("답글")}
                          </span>
                        }
                      >
                        <CommentForm action={reply} parent={c.id} />
                      </Collapsible>
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
              <Button href={signIn} variant="secondary" icon={<Icon name="comment" size={16} />} label={t("로그인하고 댓글 달기")} />
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

/** Author only: numbers to call when the AI read an emergency or a crisis in the post (ALERTS in src/lib/guide.ts). */
function AlertCard({ id, t }: { id: string; t: T }) {
  const a = alertOf(id);
  if (!a) return null;
  const lines = a.tels.map(hotline).filter((h) => h !== undefined);
  return (
    // Crisis reads in the error (rose) tone with a heart, an emergency in warning amber; the numbers sit in the card below.
    <section aria-label={t(a.ko)} className="mx-4 mt-4">
      <Banner
        status={a.crisis ? "error" : "warning"}
        collapsible={false}
        icon={<Icon name={a.crisis ? "heart" : "alert"} size={18} />}
        title={a.crisis ? t("혼자 감당하지 않아도 돼요") : t("급한 상황이면 먼저 연락하세요")}
        description={
          <>
            {a.crisis ? t("글에서 힘든 상황이 느껴져서 도움받을 수 있는 곳을 먼저 알려 드려요.") : t("이웃의 답을 기다리는 동안 바로 도움받을 수 있는 곳이에요.")}{" "}
            {t("이 안내는 나에게만 보여요.")}
          </>
        }
      >
        <ul className="space-y-2">
          {lines.map((h) => (
            <li key={h.tel}>
              <HelpItem h={h} t={t} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs opacity-75">{t("AI가 글을 읽고 보여 준 안내라 틀릴 수 있어요.")}</p>
      </Banner>
    </section>
  );
}

function Comment({
  c,
  postId,
  t,
  lang,
  signedIn,
  target,
  accepted = false,
  canAccept = false,
}: {
  c: CommentRow;
  postId: string;
  t: T;
  lang: Lang;
  signedIn: boolean;
  target: string;
  accepted?: boolean;
  canAccept?: boolean; // the question's author, on a top-level reply by someone else
}) {
  if (c.hidden)
    return (
      <Card variant="muted" padding={3} className="text-sm">
        <p className="italic opacity-70">{t("운영 정책에 따라 가려진 댓글이에요")}</p>
        {c.mine && <AppealForm comment={c.id} status={c.appeal} />}
      </Card>
    );
  return (
    // The accepted answer and the author's own replies carry a colored edge (success green, the culture color).
    <Card
      data-comment
      id={`c-${c.id}`}
      className={`scroll-mt-24 ${accepted ? "border-l-4 border-l-[var(--color-success)]" : c.anon_no === 0 ? "border-l-4 border-l-primary" : ""}`}
    >
      <div className="flex gap-3">
        <Avatar code={c.nationality} size={34} look={c.avatar} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold" data-handle>
              {c.anon_no === 0 ? t("글쓴이") : t("이웃 {n}", { n: c.anon_no })}
            </span>
            <NationalityChip code={c.nationality} lang={lang} />
            <LevelBadge points={c.points} t={t} />
            <span className="opacity-70">{timeAgo(c.created_at, lang)}</span>
            {accepted && (
              <Badge variant="success" icon={<Icon name="check" size={12} />} label={t("채택된 답변")} data-accepted />
            )}
          </div>
          <div className="mt-1.5">
            <Translatable kind="c" id={c.id} body={c.body} target={target} small className="text-[15px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]" />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
            {signedIn ? (
              // The pull-left sits on the form: a negative margin on the button itself made Astryx truncate the count.
              <form action={toggleLike} className="-ml-2">
                <input type="hidden" name="comment" value={c.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  aria-pressed={c.liked}
                  icon={<Icon name="helpful" size={15} filled={c.liked} />}
                  label={`${t("도움돼요")} ${c.likes}`}
                  className={c.liked ? "text-primary" : "text-[var(--color-text-secondary)]"}
                >
                  {c.likes}
                </Button>
              </form>
            ) : (
              <span className="inline-flex h-8 items-center gap-1 text-[var(--color-text-secondary)]">
                <Icon name="helpful" size={15} />
                {c.likes}
              </span>
            )}
            {canAccept && (
              <form action={acceptAnswer}>
                <input type="hidden" name="post" value={postId} />
                <input type="hidden" name="comment" value={c.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  aria-pressed={accepted}
                  icon={<Icon name="check" size={14} />}
                  label={accepted ? t("채택 취소") : t("이 답변 채택")}
                  className="text-[var(--color-text-success)]"
                />
              </form>
            )}
            <span className="ml-auto">
              {c.mine ? (
                <DeleteButton name="comment" id={c.id} label={t("삭제")} confirm={t("이 댓글을 삭제할까요?")} yes={t("삭제")} />
              ) : (
                signedIn && (
                  <Button
                    href={`/report?comment=${c.id}&post=${postId}`}
                    variant="ghost"
                    icon={<Icon name="siren" size={13} className="text-[var(--color-icon-error)]" />}
                    label={t("신고")}
                    className="text-[var(--color-text-secondary)]"
                  />
                )
              )}
            </span>
          </div>
        </div>
        </div>
    </Card>
  );
}
