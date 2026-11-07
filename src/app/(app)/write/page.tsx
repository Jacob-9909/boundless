import Link from "next/link";
import type { CSSProperties } from "react";
import { createPost } from "@/app/actions";
import { WriteForm } from "@/components/forms";
import { Icon } from "@/components/Icon";
import { BackLink, Flag, Landmark, PageHead, SignInRequired } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { BOARDS, boardOf, GROUPS, isBoard, LOUNGE } from "@/lib/boards";
import { cultureOf, themeVars } from "@/lib/cultures";
import { countryName, langName, POST_LANGS } from "@/lib/i18n";

export const metadata = { title: "Write" };

export default async function WritePage(props: PageProps<"/write">) {
  const sp = await props.searchParams;
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  if (!user) return <SignInRequired t={t} next={`/write?${new URLSearchParams(sp as Record<string, string>)}`} />;
  const lounge = sp.space === "lounge";
  const boardId = String(sp.board ?? "");
  const culture = cultureOf(user.nationality);
  const country = countryName(user.nationality, lang);

  // Step 1: pick where the post goes.
  if (!lounge && !isBoard(boardId)) {
    return (
      <div className="mx-auto max-w-4xl lg:ml-2 pb-6">
        <BackLink href="/feed" label={t("뒤로")} />
        <PageHead line="WRITE · STEP 1" title={t("어디에 올릴까요?")} desc={t("이야기에 맞는 게시판을 고르면 말머리와 쓰는 방법을 안내해 드려요.")} />
        <div className="space-y-6 px-4 py-5">
          <Link
            href="/write?space=lounge"
            style={themeVars(culture) as CSSProperties}
            className="relative flex items-center gap-4 overflow-hidden rounded-2xl bg-primary p-5 text-paper transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span className="bg-pattern absolute inset-0 opacity-25" aria-hidden="true" />
            <Landmark culture={culture} className="absolute right-0 bottom-0 h-16 w-auto opacity-80" />
            <Flag code={user.nationality} h={28} className="relative" />
            <span className="relative">
              <span className="block font-display text-lg font-extrabold">{t("{country} 라운지", { country })}</span>
              <span className="block text-sm opacity-85">{t("같은 나라 이웃만 보는 공간. 우리말로 편하게.")}</span>
            </span>
          </Link>
          {GROUPS.map((gr) => (
            <section key={gr.id}>
              <h2 className="mb-2 text-sm font-extrabold opacity-70">{t(gr.ko)}</h2>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {BOARDS.filter((b) => b.group === gr.id).map((b) => (
                  <li key={b.id}>
                    <Link href={`/write?board=${b.id}`} className="flex h-full items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/[.07] transition hover:-translate-y-0.5 hover:shadow-md hover:ring-ink/15">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: b.color }}>
                        <Icon name={b.icon} size={20} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold">{t(b.ko)}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed opacity-70">{t(b.desc)}</span>
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          {b.tags.map((tg) => (
                            <span key={tg.id} className="rounded-md bg-ink/[.05] px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap">
                              {t(tg.ko)}
                            </span>
                          ))}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: write, with fields for that board.
  const board = lounge ? LOUNGE : boardOf(boardId);
  const guess = culture.langs[0]?.split("-")[0] ?? "";
  const tagParam = String(sp.kind ?? "");
  const initial = {
    title: String(sp.title ?? "").slice(0, 120),
    kind: board.tags.some((x) => x.id === tagParam) ? tagParam : board.tags[0].id,
    region: user.region ?? "",
    lang: POST_LANGS.includes(guess) ? guess : "en",
  };
  return (
    <div className="mx-auto max-w-3xl lg:ml-2 pb-6">
      <BackLink href={lounge ? "/lounge" : `/b/${board.id}`} label={t("뒤로")} />
      <WriteForm
        action={createPost}
        submitLabel={t("올리기")}
        board={board}
        space={lounge ? "lounge" : "global"}
        changeHref="/write"
        initial={initial}
        langs={POST_LANGS.map((code) => ({ code, name: langName(code, lang) }))}
        nationality={user.nationality}
        countryLabel={country}
        draftKey={`${lounge ? "lounge" : "global"}:${board.id}`}
      />
    </div>
  );
}
