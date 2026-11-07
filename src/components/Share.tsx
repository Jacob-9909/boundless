"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { useT } from "./I18n";

/** Share a post: the phone's share sheet when there is one, otherwise copy the link. */
export function ShareButton({ title, className }: { title: string; className: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share) return await navigator.share({ title, url });
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Share sheet dismissed, or clipboard blocked: nothing to undo.
    }
  };
  return (
    <button type="button" onClick={share} className={className}>
      <Icon name={copied ? "check" : "external"} size={16} />
      <span aria-live="polite">{copied ? t("링크를 복사했어요") : t("공유")}</span>
    </button>
  );
}
