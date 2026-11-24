import Link from "next/link";
import { Card } from "@astryxdesign/core/Card";
import { Icon, type IconName } from "@/components/Icon";
import { Flag, Notice, PageHead, SignInRequired } from "@/components/ui";
import { getT, getUser } from "@/features/auth/auth";
import { countryName, timeAgo } from "@/features/i18n/i18n";
import { markNotesRead, notes, type Note, type NoteKind } from "@/features/notifications/notifications";

export const metadata = { title: "Notifications" };

// One color per kind, so a glance down the list tells answers from thanks.
const LOOK: Record<NoteKind, { icon: IconName; color: string }> = {
  reply: { icon: "comment", color: "#0052A4" },
  like: { icon: "helpful", color: "#E6186C" },
  helpful: { icon: "helpful", color: "#E6186C" },
  accepted: { icon: "check", color: "#00A84D" },
  following: { icon: "following", color: "#996CAC" },
};

export default async function NotificationsPage() {
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  if (!user) return <SignInRequired t={t} next="/notifications" />;
  const list = await notes(user.id);
  // Opening the list reads it: the bell clears on the next page.
  if (list.some((n) => n.at > user.seen_at)) await markNotesRead(user.id);

  const what = (n: Note) => {
    const who = n.anon_no === 0 ? t("글쓴이") : t("이웃 {n}", { n: n.anon_no ?? 0 });
    switch (n.kind) {
      case "reply":
        return t("{who}의 새 답변", { who });
      case "like":
        return t("이웃 {n}명이 내 글에 도움돼요를 눌렀어요", { n: n.n });
      case "helpful":
        return t("이웃 {n}명이 내 답변에 도움돼요를 눌렀어요", { n: n.n });
      case "accepted":
        return t("내 답변이 채택됐어요");
      case "following":
        return t("팔로우한 {country} 이웃의 새 글", { country: countryName(n.nationality ?? "", lang) });
    }
  };

  return (
    <div className="mx-auto max-w-3xl pb-6 lg:ml-2">
      <PageHead line={4} title={t("알림")} desc={t("내 글과 답변에 이웃들이 남긴 반응이에요. 최근 30일만 보여 줘요.")} />
      <div className="px-4 py-4">
        {list.length ? (
          <Card padding={0} className="overflow-hidden">
            <ul className="divide-y divide-[var(--color-border)]">
              {list.map((n) => {
                const fresh = n.at > user.seen_at;
                const look = LOOK[n.kind];
                return (
                  <li key={`${n.kind}-${n.post_id}-${n.comment_id}-${+n.at}`}>
                    <Link
                      href={`/posts/${n.post_id}${n.comment_id ? `#c-${n.comment_id}` : ""}`}
                      className={`flex gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-background-muted)] ${fresh ? "bg-soft/50" : ""}`}
                    >
                      <span className="relative mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-white" style={{ background: look.color }}>
                        <Icon name={look.icon} size={17} />
                        {n.nationality && (
                          <span className="absolute -right-1 -bottom-1">
                            <Flag code={n.nationality} h={13} round className="ring-2 ring-white" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="min-w-0 flex-1 text-sm font-bold">{what(n)}</span>
                          <time dateTime={new Date(n.at).toISOString()} className="shrink-0 text-xs opacity-70">
                            {timeAgo(n.at, lang)}
                          </time>
                        </span>
                        <span className="mt-0.5 block truncate text-[13px] opacity-80">{n.title}</span>
                        {n.body && n.kind !== "like" && (
                          <span className="mt-1 line-clamp-2 border-l-2 border-[var(--color-border-emphasized)] pl-2 text-[13px] leading-relaxed opacity-75 [overflow-wrap:anywhere]">
                            {n.body}
                          </span>
                        )}
                      </span>
                      {fresh && (
                        <span className="mt-2 size-2 shrink-0 rounded-full bg-alert">
                          <span className="sr-only">{t("새 알림")}</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : (
          <Notice title={t("아직 알림이 없어요")} icon="bell">
            {t("질문을 올리거나 답변을 달면 이웃들의 반응이 여기에 모여요.")}
          </Notice>
        )}
      </div>
    </div>
  );
}
