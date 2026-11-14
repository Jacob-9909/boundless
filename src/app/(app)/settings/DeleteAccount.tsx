"use client";

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { deleteAccount } from "@/app/actions";
import { useT } from "@/components/I18n";

/**
 * Account deletion: a confirm dialog that still posts confirm=on, which deleteAccount checks on the server.
 * A Dialog rather than AlertDialog because the "I understand" checkbox stays (AlertDialog takes no content).
 */
export function DeleteAccount() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [ok, setOk] = useState(false);
  const close = (o: boolean) => {
    setOpen(o);
    if (!o) setOk(false);
  };
  return (
    <>
      <Button label={t("탈퇴하기")} variant="destructive" onClick={() => setOpen(true)} />
      <Dialog isOpen={open} onOpenChange={close} purpose="form">
        {/* Not titled 탈퇴하기: the closed dialog stays in the DOM and would repeat the button's text. */}
        <DialogHeader title={t("탈퇴하면 내 글, 댓글, 신고 기록이 모두 삭제되고 되돌릴 수 없어요.")} onOpenChange={close} />
        <form action={deleteAccount} className="space-y-4 p-4">
          <CheckboxInput htmlName="confirm" label={t("모두 삭제되는 것을 이해했어요")} value={ok} onChange={setOk} />
          <div className="flex flex-wrap justify-end gap-2">
            <Button label={t("취소")} variant="secondary" onClick={() => close(false)} />
            <Button type="submit" label={t("탈퇴")} variant="destructive" isDisabled={!ok} />
          </div>
        </form>
      </Dialog>
    </>
  );
}
