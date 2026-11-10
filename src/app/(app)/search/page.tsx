import Link from "next/link";
import { NationalityChip, Notice, PageHead, PostCard, btn, btnGhost, field, labelCls, BoardBadge, postList } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { track } from "@/lib/db";
import { BOARDS, isBoard } from "@/lib/boards";
import { isCountry, isRegion, REGIONS } from "@/lib/i18n";
import { listPosts, PAGE } from "@/lib/posts";

export const metadata = { title: "Search" };

export default async function SearchPage(props: PageProps<"/search">) {
  const sp = await props.searchParams;
  const query = String(sp.q ?? "")
    .normalize("NFC")
    .trim()
    .slice(0, 100);
  const topic = isBoard(String(sp.board ?? "")) ? String(sp.board) : "";
  const from = isCountry(String(sp.from ?? "")) ? String(sp.from) : "";
  const region = isRegion(String(sp.region ?? "")) ? String(sp.region) : "";
  const sort = sp.sort === "likes" ? "likes" : "new";
  const before = typeof sp.before === "string" && sort === "new" ? sp.before : undefined;
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  const searched = Boolean(query || topic || from || region);
  const posts = searched ? await listPosts(user?.id ?? null, { query, board: topic, nationality: from, region, before, sort }) : [];
  const last = posts.at(-1);
  const more = new URLSearchParams({ q: query, board: topic, from, region, ...(last ? { before: new Date(last.listed_at).toISOString() } : {}) });
  if (query) track("search", user?.id ?? null);

  return (
    <div className="mx-auto max-w-3xl lg:ml-2 pb-6">
      <PageHead line="LINE 02 · SEARCH" title={t("검색")} desc={t("글 원문과, 한 번이라도 번역된 글의 번역문에서 찾아요.")} />
      <form className="space-y-3 px-4 py-4" role="search">
        {from && (
          <div className="flex items-center gap-2 text-sm">
            <input type="hidden" name="from" value={from} />
            <NationalityChip code={from} lang={lang} prefix={t("이웃의 글")} />
            <Link href={`/search?${new URLSearchParams({ q: query, board: topic, region })}`} className="text-xs text-primary underline">
              {t("국적 필터 해제")}
            </Link>
          </div>
        )}
        <div>
          <label htmlFor="q" className={labelCls}>
            {t("검색어")}
          </label>
          <div className="flex gap-2">
            <input id="q" name="q" defaultValue={query} className={field} />
            <button className={btn}>{t("검색")}</button>
          </div>
        </div>
        <div>
          <label htmlFor="board" className={labelCls}>
            {t("주제")}
          </label>
          <select id="board" name="board" defaultValue={topic} className={field}>
            <option value="">{t("전체 주제")}</option>
            {BOARDS.map((b) => (
              <option key={b.id} value={b.id}>
                {t(b.ko)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="region" className={labelCls}>
              {t("지역")}
            </label>
            <select id="region" name="region" defaultValue={region} className={field}>
              <option value="">{t("전국")}</option>
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {t(r.ko)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort" className={labelCls}>
              {t("정렬")}
            </label>
            <select id="sort" name="sort" defaultValue={sort} className={field}>
              <option value="new">{t("최신순")}</option>
              <option value="likes">{t("도움돼요 많은 순")}</option>
            </select>
          </div>
        </div>
      </form>

      <div className="px-4 pb-6">
        {!searched ? (
          <>
            <Notice title={t("글 검색")}>{t("“부산”이나 “Library”처럼 찾아보세요. 검색은 원문을 기준으로 해요.")}</Notice>
            <p className="mt-5 mb-2 text-sm font-bold">{t("주제로 둘러보기")}</p>
            <ul className="flex flex-wrap gap-1.5">
              {BOARDS.map((b) => (
                <li key={b.id}>
                  <BoardBadge id={b.id} t={t} href={`/b/${b.id}`} />
                </li>
              ))}
            </ul>
          </>
        ) : posts.length ? (
          <>
            <p className="mb-2 text-sm opacity-70">{posts.length === PAGE ? t("최근 {n}개의 글", { n: PAGE }) : t("{n}개의 글", { n: posts.length })}</p>
            <ul className={postList}>
              {posts.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} lang={lang} t={t} />
                </li>
              ))}
            </ul>
            {posts.length === PAGE && sort === "new" && (
              <Link href={`/search?${more}`} className={`${btnGhost} mt-4 w-full`}>
                {t("이전 글 더 보기")}
              </Link>
            )}
          </>
        ) : (
          <Notice label={t("결과 없음")} title={t("검색 결과가 없어요")}>
            <p>{t("검색어를 바꾸거나 주제 필터를 해제해 보세요. 그래도 없다면 직접 물어보세요.")}</p>
            <Link href={`/write?${new URLSearchParams({ title: query, board: topic })}`} className="mt-3 inline-flex h-10 items-center font-bold text-primary underline">
              {t("질문 올리기")}
            </Link>
            {/* Search only covers posts; someone typing "police" or "112" in a hurry still gets the numbers. */}
            <Link href="/guide" className="mt-3 ml-4 inline-flex h-10 items-center font-bold text-red-700 underline">
              112 · 119 · {t("공식 안내")}
            </Link>
          </Notice>
        )}
      </div>
    </div>
  );
}
