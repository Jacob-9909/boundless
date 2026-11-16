"use client";

import { useState, useTransition } from "react";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Button } from "@astryxdesign/core/Button";
import { deleteOwn } from "@/app/actions";
import { Icon } from "./Icon";
import { useT } from "./I18n";

/** Share a post: the phone's share sheet when there is one, otherwise copy the link. */
export function ShareButton({ title, className }: { title: string; className?: string }) {
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
  const label = copied ? t("링크를 복사했어요") : t("공유");
  return (
    <Button onClick={share} variant="secondary" label={label} icon={<Icon name={copied ? "check" : "external"} size={16} />} className={className}>
      <span aria-live="polite">{label}</span>
    </Button>
  );
}

/**
 * Delete my post or comment after a confirm. Lives here because the post page is a server component
 * and this needs client state; it posts the same field to the same deleteOwn action the old form did.
 */
export function DeleteButton({ name, id, label, confirm, yes }: { name: "post" | "comment"; id: string; label: string; confirm: string; yes: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const remove = () =>
    start(async () => {
      const f = new FormData();
      f.set(name, id);
      await deleteOwn(f); // a post redirects to /me; a comment refreshes the page
      setOpen(false);
    });
  return (
    <>
      <Button variant="ghost" label={label} icon={<Icon name="trash" size={14} />} onClick={() => setOpen(true)} />
      <AlertDialog
        isOpen={open}
        onOpenChange={setOpen}
        title={label}
        description={confirm}
        actionLabel={yes}
        cancelLabel={t("취소")}
        isActionLoading={pending}
        onAction={remove}
      />
    </>
  );
}
