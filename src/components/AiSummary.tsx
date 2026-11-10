"use client";

import { useEffect, useState } from "react";
import { aiSummary, type SummaryView } from "@/app/actions";
import { Icon } from "./Icon";
import { useT } from "./I18n";
import { Linkify } from "./RichText";

const head = "mt-4 text-xs font-bold opacity-70";

/** Loads after the page, so a post never waits on the AI. Shows nothing when no summary can be made. */
export function AiSummary({ postId }: { postId: string }) {
  const t = useT();
  const [s, setS] = useState<SummaryView | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    aiSummary(postId)
      .then((r) => live && setS(r))
      .catch(() => live && setS(null));
    return () => {
      live = false;
    };
  }, [postId]);
  if (s === null) return null;
  return (
    <section aria-label={t("AI 요약")} aria-busy={!s} className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 text-violet-950 md:p-5">
      <p className="flex items-center gap-1.5 text-xs font-bold text-violet-800">
        <Icon name="sparkles" size={15} />
        {t("AI 요약")} · {t("이웃들의 답변을 정리했어요")}
      </p>
      {!s ? (
        <p className="mt-3 animate-pulse text-sm opacity-70">{t("요약을 만드는 중…")}</p>
      ) : (
        <>
          <p className="mt-3 font-bold [overflow-wrap:anywhere]">{s.situation}</p>
          <h3 className={head}>{t("해결 방법")}</h3>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-[15px] leading-relaxed [overflow-wrap:anywhere]">
            {s.steps.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ol>
          {s.documents.length > 0 && (
            <>
              <h3 className={head}>{t("필요한 서류·준비물")}</h3>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {s.documents.map((x, i) => (
                  <li key={i} className="rounded-full bg-white px-3 py-1 text-sm ring-1 ring-violet-200">
                    {x}
                  </li>
                ))}
              </ul>
            </>
          )}
          {s.contacts.length > 0 && (
            <>
              <h3 className={head}>{t("연락처")}</h3>
              <ul className="mt-1 space-y-1 text-sm [overflow-wrap:anywhere]">
                {s.contacts.map((x, i) => (
                  <li key={i} className="flex gap-1.5">
                    <Icon name="phone" size={15} className="mt-0.5" />
                    <span>
                      <Linkify text={x} />
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {s.refs.length > 0 && (
            <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="font-bold opacity-70">{t("근거")}</span>
              {s.refs.map((r) => (
                <a key={r.id} href={`#c-${r.id}`} className="inline-flex h-7 items-center rounded-full bg-white px-2.5 font-bold text-violet-800 ring-1 ring-violet-200 hover:ring-violet-400">
                  {r.no === 0 ? t("글쓴이") : t("이웃 {n}", { n: r.no })}
                </a>
              ))}
            </p>
          )}
          <p className="mt-3 text-xs opacity-75">{t("AI가 만든 요약이라 틀릴 수 있어요. 중요한 내용은 원래 답변과 공식 안내로 확인하세요.")}</p>
        </>
      )}
    </section>
  );
}
