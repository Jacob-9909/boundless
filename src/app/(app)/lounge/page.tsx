import Link from "next/link";
import { WithRail } from "@/components/Community";
import { FeedList, ListControls, listHref, parseSort } from "@/components/Feed";
import { Icon } from "@/components/Icon";
import { Flag, Landmark, SignInRequired } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { LOUNGE } from "@/lib/boards";
import { cultureOf } from "@/lib/cultures";
import { countryName } from "@/lib/i18n";
import { listPosts, loungeCount, memberCount } from "@/lib/posts";

export const metadata = { title: "Lounge" };

/** A country's lounge: only members of that nationality can read and write here. */
export default async function LoungePage(props: PageProps<"/lounge">) {
  const sp = await props.searchParams;
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  if (!user)
    return (
      <SignInRequired
        t={t}
        next="/lounge"
        title={t("우리나라 라운지는 같은 국적 이웃만 들어올 수 있어요")}
        desc={t("로그인하면 내 나라 이웃들과 우리말로 이야기할 수 있어요.")}
      />
    );
  const culture = cultureOf(user.nationality);
  const country = countryName(user.nationality, lang);
  const tag = LOUNGE.tags.some((x) => x.id === sp.tag) ? String(sp.tag) : "";
  const sort = parseSort(sp.sort);
  const before = typeof sp.before === "string" && sort === "new" ? sp.before : undefined;
  const [posts, total, members] = await Promise.all([
    listPosts(user.id, { space: user.nationality, tag, before, sort: sort === "likes" ? "likes" : "new", waiting: sort === "waiting" }),
    loungeCount(user.nationality),
    memberCount(user.nationality),
  ]);
  const neighbors = members || 1;

  return (
    <WithRail viewer={user.id} lang={lang} t={t}>
      <div className="min-w-0 space-y-4">
        <header className="relative overflow-hidden rounded-3xl bg-primary p-6 text-paper md:p-8">
          <span className="bg-pattern absolute inset-0 opacity-30" aria-hidden="true" />
          <span className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" aria-hidden="true" />
          <Landmark culture={culture} className="absolute right-0 bottom-0 h-28 w-auto opacity-90 md:h-36" />
          <div className="relative max-w-xl">
            <p className="flex items-center gap-2 text-sm font-bold opacity-90">
              <Flag code={user.nationality} h={14} />
              {t("{country} 라운지", { country })}
            </p>
            <h1 className="mt-2 font-culture text-3xl leading-tight md:text-[42px]">{culture.greet}</h1>
            <p className="mt-2 text-sm opacity-90 [text-shadow:0_1px_6px_rgb(0_0_0/.4)]">{t("{country} 이웃만 볼 수 있는 공간이에요. 우리말로 편하게 이야기해요.", { country })}</p>
            <p className="mt-3 flex flex-wrap items-center gap-3 text-xs opacity-85 [text-shadow:0_1px_6px_rgb(0_0_0/.4)]">
              <span className="inline-flex items-center gap-1">
                <Icon name="users" size={14} />
                {t("이웃 {n}명", { n: neighbors })}
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="file" size={14} />
                {t("글 {n}개", { n: total })}
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="lock" size={14} />
                {t("다른 나라 이웃에게는 보이지 않아요")}
              </span>
            </p>
            <Link href="/write?space=lounge" className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-5 text-[15px] font-bold whitespace-nowrap text-primary hover:bg-white/90">
              <Icon name="edit" size={17} />
              {t("라운지에 쓰기")}
            </Link>
          </div>
        </header>
        <ListControls base="/lounge" tags={LOUNGE.tags} tag={tag} sort={sort} t={t} />
        <FeedList
          posts={posts}
          lang={lang}
          t={t}
          showBoard={false}
          emptyTitle={t("라운지가 아직 조용해요")}
          emptyBody={t("고향 이웃들에게 첫 인사를 남겨 보세요.")}
          moreHref={sort === "new" ? (b) => listHref("/lounge", { tag, sort }, { before: b }) : undefined}
        />
      </div>
    </WithRail>
  );
}
