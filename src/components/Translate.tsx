"use client";

import { useState, useTransition } from "react";
import { Button } from "@astryxdesign/core/Button";
import { translate } from "@/app/actions";
import { Icon } from "./Icon";
import { useT } from "./I18n";
import { Linkify } from "./RichText";

/**
 * Shows a post body or comment in its original language, with a button that adds a translation
 * into the reader's language right below it (cached on the server after the first time).
 * The original stays on screen so both can be compared, and its links keep working.
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
      <div className={className}>
        <Linkify text={body} />
      </div>
      {showing && out && (
        <div className="mt-3 rounded-[var(--radius-element)] border-l-4 border-primary/50 bg-soft/50 p-3">
          <p className="mb-1 inline-flex items-center gap-1 text-[11px] font-bold text-primary">
            <Icon name="translate" size={12} />
            {t("{lang}로 번역됨", { lang: target })}
          </p>
          {out.title && <p className="mb-1 font-bold">{out.title}</p>}
          <div className={className}>
            <Linkify text={out.body} />
          </div>
        </div>
      )}
      {/* Comments get a quiet ghost button; the post body an outlined one. Both in the member's color. */}
      <Button
        onClick={click}
        isLoading={pending}
        variant={small ? "ghost" : "secondary"}
        icon={<Icon name="translate" size={small ? 13 : 15} />}
        label={pending ? t("번역하는 중…") : showing ? t("번역 접기") : t("{lang}로 번역", { lang: target })}
        className={`mt-2 text-primary ${small ? "-ml-2" : "rounded-full"}`}
      />
      {error && (
        <p role="alert" className="mt-1 text-xs text-[var(--color-text-error)]">
          {t(error)}
        </p>
      )}
    </div>
  );
}
