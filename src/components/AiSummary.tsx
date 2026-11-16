"use client";

import { useEffect, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Token } from "@astryxdesign/core/Token";
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
    // Violet is the AI's color across the app, so the summary reads apart from the neighbors' own words.
    <section aria-label={t("AI 요약")} aria-busy={!s} className="mt-4">
      <Card variant="purple">
        <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-purple)]">
          <Icon name="sparkles" size={15} />
          {t("AI 요약")} · {t("이웃들의 답변을 정리했어요")}
        </p>
        {!s ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm opacity-70">{t("요약을 만드는 중…")}</p>
            {["90%", "75%", "60%"].map((w, i) => (
              <Skeleton key={w} width={w} height={14} index={i} />
            ))}
          </div>
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
                    <li key={i} className="max-w-full">
                      <Token label={x} />
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
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
                <span className="font-bold opacity-70">{t("근거")}</span>
                {/* Each one jumps to the answer it came from (#c-<id> on the post page). */}
                {s.refs.map((r) => (
                  <Button key={r.id} href={`#c-${r.id}`} variant="secondary" label={r.no === 0 ? t("글쓴이") : t("이웃 {n}", { n: r.no })} className="rounded-full text-[var(--color-text-purple)]" />
                ))}
              </div>
            )}
            <p className="mt-3 text-xs opacity-75">{t("AI가 만든 요약이라 틀릴 수 있어요. 중요한 내용은 원래 답변과 공식 안내로 확인하세요.")}</p>
          </>
        )}
      </Card>
    </section>
  );
}
