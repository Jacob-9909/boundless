"use client";

import { useState, useTransition } from "react";
import { translate } from "@/app/actions";
import { Icon } from "./Icon";
import { useT } from "./I18n";

/**
 * Shows a post body or comment in its original language, with a button that swaps in
 * a translation into the reader's language (cached on the server after the first time).
 */
export function Translatable({
  kind,
  id,
  body,
  target,
  className,
  small = false,
}: {
  kind: "p" | "c";
  id: string;
  body: string;
  target: string; // e.g. "Tiếng Việt", or null when the text is already in the reader's language
  className: string;
  small?: boolean;
}) {
  const t = useT();
  const [out, setOut] = useState<{ title?: string | null; body: string } | null>(null);
  const [showing, setShowing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const click = () => {
    if (out) return setShowing((v) => !v);
    start(async () => {
      setError(null);
      const r = await translate(kind, id);
      if (r.error || !r.body) return setError(r.error ?? "지금은 번역할 수 없어요. 잠시 뒤 다시 시도해 주세요.");
      setOut({ title: r.title, body: r.body });
      setShowing(true);
    });
  };

  return (
    <div>
      {showing && out ? (
        <div className="rounded-xl bg-soft/50 p-3">
          <p className="mb-1 inline-flex items-center gap-1 text-[11px] font-bold text-primary">
            <Icon name="translate" size={12} />
            {t("{lang}로 번역됨", { lang: target })}
          </p>
          {out.title && <p className="mb-1 font-bold">{out.title}</p>}
          <div className={className}>{out.body}</div>
        </div>
      ) : (
        <div className={className}>{body}</div>
      )}
      <button
        type="button"
        onClick={click}
        disabled={pending}
        className={`mt-2 inline-flex items-center gap-1 rounded-full font-bold text-primary transition hover:bg-soft disabled:opacity-50 ${small ? "h-7 px-1.5 text-xs" : "h-8 px-2.5 text-[13px] ring-1 ring-primary/25"}`}
      >
        <Icon name="translate" size={small ? 13 : 15} />
        {/* Not "원문 보기": the admin queue uses that key for "Open post", so every language read "open post" here. */}
        {pending ? t("번역하는 중…") : showing ? t("원문으로 돌아가기") : t("{lang}로 번역", { lang: target })}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {t(error)}
        </p>
      )}
    </div>
  );
}
