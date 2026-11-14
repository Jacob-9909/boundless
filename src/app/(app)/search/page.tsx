import { Button } from "@astryxdesign/core/Button";
import { MoreButton, PostList } from "@/components/Feed";
import { SelectField, TextField } from "@/components/fields";
import { Icon } from "@/components/Icon";
import { NationalityChip, Notice, PageHead, PostCard, BoardBadge } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { track } from "@/lib/db";
import { BOARDS, isBoard } from "@/lib/boards";
import { isCountry, isRegion, isVisa, REGIONS, VISAS } from "@/lib/i18n";
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
  const visa = isVisa(String(sp.visa ?? "")) ? String(sp.visa) : "";
  const sort = sp.sort === "likes" ? "likes" : "new";
  const before = typeof sp.before === "string" && sort === "new" ? sp.before : undefined;
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  const searched = Boolean(query || topic || from || region || visa);
  const posts = searched ? await listPosts(user?.id ?? null, { query, board: topic, nationality: from, region, visa, before, sort }) : [];
  const last = posts.at(-1);
  const more = new URLSearchParams({ q: query, board: topic, from, region, visa, ...(last ? { before: new Date(last.listed_at).toISOString() } : {}) });
  if (query) track("search", user?.id ?? null);

  return (
    <div className="mx-auto max-w-3xl lg:ml-2 pb-6">
      <PageHead line="LINE 02 · SEARCH" title={t("검색")} desc={t("글 원문과, 한 번이라도 번역된 글의 번역문에서 찾아요.")} />
      <form className="space-y-3 px-4 py-4" role="search">
        {from && (
          <div className="flex items-center gap-2 text-sm">
            <input type="hidden" name="from" value={from} />
            <NationalityChip code={from} lang={lang} prefix={t("이웃의 글")} />
            <Button href={`/search?${new URLSearchParams({ q: query, board: topic, region, visa })}`} label={t("국적 필터 해제")} variant="ghost" className="text-primary" />
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <TextField name="q" type="search" label={t("검색어")} defaultValue={query} startIcon="search" size="lg" width="100%" />
          </div>
          <Button type="submit" label={t("검색")} variant="primary" size="lg" />
        </div>
        <SelectField
          name="board"
          label={t("주제")}
          defaultValue={topic}
          options={[{ value: "", label: t("전체 주제") }, ...BOARDS.map((b) => ({ value: b.id, label: t(b.ko) }))]}
          width="100%"
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField name="region" label={t("지역")} defaultValue={region} options={[{ value: "", label: t("전국") }, ...REGIONS.map((r) => ({ value: r.id, label: t(r.ko) }))]} width="100%" />
          <SelectField name="visa" label={t("체류자격")} defaultValue={visa} options={[{ value: "", label: t("전체 체류자격") }, ...VISAS.map((x) => ({ value: x.id, label: t(x.ko) }))]} width="100%" />
          <SelectField
            name="sort"
            label={t("정렬")}
            defaultValue={sort}
            options={[
              { value: "new", label: t("최신순") },
              { value: "likes", label: t("도움돼요 많은 순") },
            ]}
            width="100%"
          />
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
            <p className="mb-2 text-sm text-[var(--color-text-secondary)]">{posts.length === PAGE ? t("최근 {n}개의 글", { n: PAGE }) : t("{n}개의 글", { n: posts.length })}</p>
            <PostList>
              {posts.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} lang={lang} t={t} />
                </li>
              ))}
            </PostList>
            {posts.length === PAGE && sort === "new" && <MoreButton href={`/search?${more}`} t={t} />}
          </>
        ) : (
          <Notice label={t("결과 없음")} title={t("검색 결과가 없어요")}>
            <p>{t("검색어를 바꾸거나 주제 필터를 해제해 보세요. 그래도 없다면 직접 물어보세요.")}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Button href={`/write?${new URLSearchParams({ title: query, board: topic })}`} label={t("질문 올리기")} variant="primary" icon={<Icon name="edit" size={16} />} />
              {/* Search only covers posts; someone typing "police" or "112" in a hurry still gets the numbers. */}
              <Button href="/guide" label={`112 · 119 · ${t("공식 안내")}`} variant="destructive" icon={<Icon name="phone" size={14} />} />
            </div>
          </Notice>
        )}
      </div>
    </div>
  );
}
