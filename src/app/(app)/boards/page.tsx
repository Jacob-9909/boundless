import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHead } from "@/components/ui";
import { getT } from "@/lib/auth";
import { BOARDS, GROUPS } from "@/lib/boards";
import { boardCounts } from "@/lib/posts";

export const metadata = { title: "Boards" };

export default async function BoardsPage() {
  const [{ t }, counts] = await Promise.all([getT(), boardCounts()]);
  return (
    <div className="mx-auto max-w-4xl lg:ml-2 pb-6">
      <PageHead line="BOARDS" title={t("게시판")} desc={t("한국 생활의 모든 순간을 게시판별로 나눠 두었어요.")} />
      <div className="space-y-6 px-4 py-5">
        <Link href="/lounge" className="flex items-center gap-3 rounded-2xl bg-ink p-4 text-white">
          <Icon name="users" size={22} />
          <span className="flex-1">
            <span className="block font-bold">{t("우리나라 라운지")}</span>
            <span className="block text-xs opacity-70">{t("같은 국적 이웃만 들어오는 공간")}</span>
          </span>
          <Icon name="next" size={18} />
        </Link>
        {GROUPS.map((gr) => (
          <section key={gr.id}>
            <h2 className="mb-2 text-sm font-extrabold opacity-70">{t(gr.ko)}</h2>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {BOARDS.filter((b) => b.group === gr.id).map((b) => {
                const c = counts.find((x) => x.topic === b.id);
                return (
                  <li key={b.id}>
                    <Link href={`/b/${b.id}`} className="flex h-full items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/[.07] transition hover:-translate-y-0.5 hover:shadow-md">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: b.color }}>
                        <Icon name={b.icon} size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-bold">
                          {t(b.ko)}
                          {!!c?.today && <span className="rounded-full bg-alert px-1.5 text-[11px] text-white">{t("새 글 {n}", { n: c.today })}</span>}
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed opacity-70 md:line-clamp-none">{t(b.desc)}</span>
                      </span>
                      <span className="text-xs opacity-70">{c?.n ?? 0}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <Link href="/guide" className="flex min-h-10 items-center gap-2 text-sm font-bold text-primary">
          <Icon name="info" size={16} />
          {t("공식 안내 (비자·의료·긴급 전화)")}
        </Link>
      </div>
    </div>
  );
}
