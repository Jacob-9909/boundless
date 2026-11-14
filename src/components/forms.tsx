"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { InputGroup, InputGroupText } from "@astryxdesign/core/InputGroup";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { aiCheckDraft, appeal, countView, reportContent, similarPosts, updateNationality, type PostState, type Result } from "@/app/actions";
import type { DraftCheck } from "@/lib/ai";
import { boardOf, type Board } from "@/lib/boards";
import { REGIONS, REPORT_REASONS, VISAS } from "@/lib/i18n";
import { findPII } from "@/lib/pii";
import { keepValues, SelectField, TextAreaField, TextField } from "./fields";
import { Icon } from "./Icon";
import { useT } from "./I18n";
import { Flag } from "./ui";

/**
 * Astryx inputs type only their own props but pass the rest to the native element, so the browser still checks
 * these before submit, as it did with plain inputs. (TextArea's own maxLength is a soft limit with a counter.)
 */
const native = (a: { required?: boolean; minLength?: number; maxLength?: number }) => a;

/** Legend for the photo group, matching Astryx field labels. */
const legend = "mb-1 block font-medium text-[var(--color-text-secondary)]";

function ErrorLine({ error }: { error?: string }) {
  const t = useT();
  if (!error) return null;
  return <Banner role="alert" status="error" title={t(error)} />;
}

const counted = new Set<string>();
/** Counts one view when a post opens: once per tab, so React's dev double run and refreshes after a like add nothing. */
export function ViewCount({ id }: { id: string }) {
  useEffect(() => {
    if (counted.has(id)) return;
    counted.add(id);
    countView(id);
  }, [id]);
  return null;
}

const MAX_PHOTOS = 4;

/** Shrink a photo to a JPEG under the server's 600 KB cap; a file the browser cannot read is sent as is (the server checks it). */
async function shrink(file: File) {
  try {
    const bmp = await createImageBitmap(file);
    for (const [side, quality] of [
      [1600, 0.82],
      [1280, 0.75],
      [1024, 0.7],
    ]) {
      const k = Math.min(1, side / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bmp.width * k);
      canvas.height = Math.round(bmp.height * k);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff"; // transparent PNGs would turn black in JPEG
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", quality));
      if (blob && blob.size <= 580_000) return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    }
  } catch {}
  return file;
}

/**
 * Up to four photos: existing ones (edit) can be unticked, new ones are shrunk in the browser before upload.
 * ponytail: the native file input stays (hidden) because the shrunk files are written back into it; Astryx FileInput
 * only hands File objects to state and would need the same hidden input anyway.
 */
function PhotoPicker({ existing = [], reset }: { existing?: { id: string }[]; reset: unknown }) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [drop, setDrop] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  // The form resets after each submit (files included), so the previews go too.
  useEffect(() => {
    queueMicrotask(() => {
      setPreviews([]);
      setNote("");
    });
  }, [reset]);
  const room = MAX_PHOTOS - (existing.length - drop.length);
  const pick = async (files: FileList | null) => {
    if (!files || !input.current) return;
    const chosen = [...files].slice(0, Math.max(0, room));
    setNote(files.length > chosen.length ? t("사진은 4장까지 올릴 수 있어요.") : "");
    const el = input.current;
    previews.forEach((u) => URL.revokeObjectURL(u));
    setPreviews([]);
    setBusy(true);
    try {
      const small = await Promise.all(chosen.map(shrink));
      const dt = new DataTransfer();
      small.forEach((f) => dt.items.add(f));
      el.files = dt.files;
      setPreviews(small.map((f) => URL.createObjectURL(f)));
    } catch {
      // A format this browser cannot decode (HEIC outside Safari, say): attach nothing rather than the full-size original.
      el.value = "";
      setNote(t("사진은 JPG, PNG, WebP, GIF만 올릴 수 있어요."));
    } finally {
      setBusy(false);
    }
  };
  const thumb = "relative size-20 overflow-hidden rounded-[var(--radius-element)] bg-ink/5 ring-1 ring-ink/10";
  return (
    <fieldset>
      <legend className={legend}>{t("사진 (선택, 4장까지)")}</legend>
      <div className="flex flex-wrap items-center gap-2">
        {existing.map((im) => {
          const off = drop.includes(im.id);
          const id = `drop-${im.id}`;
          return (
            <span key={im.id} className={`${thumb} ${off ? "opacity-40" : ""}`} title={t("빼기")}>
              {/* The photo itself toggles the checkbox too, as before. */}
              <label htmlFor={id} className="block size-full cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element -- already-uploaded photo served by /api/img */}
                <img src={`/api/img/${im.id}`} alt="" className="size-full object-cover" />
              </label>
              <span className="absolute top-1 right-1 flex rounded-md bg-white/90 p-0.5">
                <CheckboxInput
                  id={id}
                  label={t("이 사진 빼기")}
                  isLabelHidden
                  value={off}
                  onChange={() => setDrop((d) => (off ? d.filter((x) => x !== im.id) : [...d, im.id]))}
                />
              </span>
              {off && <input type="hidden" name="drop_image" value={im.id} />}
            </span>
          );
        })}
        {previews.map((u) => (
          <span key={u} className={thumb}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview (blob: URL) */}
            <img src={u} alt="" className="size-full object-cover" />
          </span>
        ))}
        <Button
          label={busy ? t("줄이는 중…") : previews.length ? t("다시 고르기") : t("사진 추가")}
          icon={<Icon name="image" size={18} />}
          isLoading={busy}
          isDisabled={room <= 0}
          onClick={() => input.current?.click()}
        />
        <input ref={input} type="file" name="images" accept="image/*" multiple disabled={room <= 0} onChange={(e) => pick(e.target.files)} hidden />
      </div>
      {note && <p className="mt-1 text-xs font-semibold text-red-700">{note}</p>}
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{t("얼굴, 외국인등록증, 집 주소가 보이는 사진은 올리지 마세요.")}</p>
    </fieldset>
  );
}

/** Before posting: the AI suggests a board or a clearer title, asks for missing details, warns about privacy. */
function AiCheck({
  board,
  space,
  canMove,
  read,
  setTitle,
}: {
  board: Board;
  space: string;
  canMove: boolean; // new posts only: the draft can follow to another board
  read: () => { title: string; body: string };
  setTitle: (v: string) => void;
}) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ check?: DraftCheck; error?: string } | null>(null);
  const run = async () => {
    setBusy(true);
    try {
      setRes(await aiCheckDraft({ ...read(), board: board.id, space }));
    } catch {
      setRes({ error: "AI 점검을 지금은 쓸 수 없어요. 잠시 뒤 다시 시도해 주세요." });
    } finally {
      setBusy(false);
    }
  };
  // The write page restores a draft saved under the new board's key, so the text comes along.
  const move = (to: string) => {
    try {
      localStorage.setItem(`draft:global:${to}`, JSON.stringify(read()));
    } catch {}
    router.push(`/write?board=${to}`);
  };
  const c = res?.check;
  const board2 = canMove ? c?.board : null;
  const clean = c && !board2 && !c.title && !c.missing.length && !c.privacy.length;
  const box = "mt-3 text-sm [overflow-wrap:anywhere]";
  return (
    // Violet marks the AI: the one part of the form that is not the member's own culture color.
    <div className="rounded-[var(--radius-container)] border border-violet-200 bg-violet-50/60 p-4 text-violet-950">
      <Button
        label={busy ? t("점검하는 중…") : t("AI로 질문 점검하기")}
        icon={<Icon name="sparkles" size={16} />}
        isLoading={busy}
        onClick={run}
        className="text-violet-800"
      />
      <p className="mt-2 text-xs opacity-75">{t("AI 점검은 글을 NVIDIA AI로 보내요. 전화번호·등록번호·이메일은 지우고 보내요.")}</p>
      <div aria-live="polite">
        {res?.error && (
          <div className={box}>
            <Banner status="error" title={t(res.error)} />
          </div>
        )}
        {clean && (
          <div className={box}>
            <Banner status="success" title={t("좋아요. 이대로 올려도 충분해요.")} />
          </div>
        )}
        {c && c.privacy.length > 0 && (
          <div className={box}>
            <Banner status="error" title={t("올리기 전에 확인해 주세요")} collapsible={false}>
              <ul className="list-disc space-y-0.5 pl-5">
                {c.privacy.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </Banner>
          </div>
        )}
        {board2 && (
          <div className={`${box} flex flex-wrap items-center gap-2`}>
            {t("이 내용은 {board} 게시판에 더 잘 맞아요.", { board: t(boardOf(board2).ko) })}
            <Button label={t("옮기기")} icon={<Icon name={boardOf(board2).icon} size={16} />} onClick={() => move(board2)} />
          </div>
        )}
        {c?.title && (
          <div className={box}>
            <p className="font-bold">{t("제목 제안")}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="rounded-[var(--radius-inner)] bg-[var(--color-background-card)] px-2.5 py-1.5 ring-1 ring-violet-200">{c.title}</span>
              <Button label={t("이 제목 쓰기")} variant="ghost" onClick={() => setTitle(c.title!)} />
            </div>
          </div>
        )}
        {c && c.missing.length > 0 && (
          <div className={box}>
            <p className="font-bold">{t("이런 정보를 더하면 답을 받기 쉬워요")}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {c.missing.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

type Day = DateInputProps["value"];

/** New post and edit share this form; the server action decides which. Fields adapt to the board. */
export function WriteForm({
  action: serverAction,
  submitLabel,
  board,
  space,
  changeHref,
  initial,
  langs,
  nationality,
  countryLabel,
  draftKey,
  images,
  ai,
}: {
  action: (s: PostState, f: FormData) => Promise<PostState>;
  submitLabel: string;
  board: Board;
  space: "global" | "lounge";
  changeHref?: string;
  initial: Record<string, string>;
  langs: { code: string; name: string }[];
  nationality: string;
  countryLabel: string;
  draftKey?: string; // new posts only: title and body autosave on this device
  images?: { id: string }[]; // edit: photos already attached
  ai?: boolean; // the server has an AI key: offer the draft check
}) {
  const t = useT();
  const [state, action, pending] = useActionState(serverAction, {});
  // Astryx inputs are controlled, so they keep what was typed through the form reset after a rejected submit.
  const v: Record<string, string> = state.values ?? initial;
  const [tagId, setTagId] = useState(v.kind || board.tags[0].id);
  const [title, setTitle] = useState(v.title ?? "");
  const [body, setBody] = useState(v.body ?? "");
  const [startsOn, setStartsOn] = useState(v.starts_on ?? "");
  const [endsOn, setEndsOn] = useState(v.ends_on ?? "");
  const [restored, setRestored] = useState(false);
  const [similar, setSimilar] = useState<Awaited<ReturnType<typeof similarPosts>>>([]);
  const lookup = useRef<ReturnType<typeof setTimeout>>(undefined);
  const askVisa = space === "global" && board.group === "life";
  const storeKey = draftKey && `draft:${draftKey}`;
  const pii = findPII(`${title}\n${body}`);
  // New posts only: while the title is typed, show up to 3 posts with similar titles so the answer may already exist.
  const findSimilar = (title: string) => {
    if (!draftKey) return;
    clearTimeout(lookup.current);
    if (title.trim().length < 2) return setSimilar([]);
    lookup.current = setTimeout(() => {
      similarPosts(board.id, space === "lounge", title).then(setSimilar, () => setSimilar([]));
    }, 400);
  };
  // Bring back a draft left on this device (closed tab, lost connection). A new post's form opens with no body.
  useEffect(() => {
    if (!storeKey) return;
    let d: { title?: string; body?: string } | null = null;
    try {
      d = JSON.parse(localStorage.getItem(storeKey) ?? "null");
    } catch {}
    const draft = d;
    if (!draft?.body) return;
    queueMicrotask(() => {
      setTitle((x) => x || (draft.title ?? ""));
      setBody(draft.body ?? "");
      setRestored(true);
    });
  }, [storeKey]);
  const saveDraft = (d: { title: string; body: string }) => {
    if (!storeKey) return;
    try {
      localStorage.setItem(storeKey, JSON.stringify(d));
    } catch {}
  };
  const dropDraft = () => {
    if (!storeKey) return;
    try {
      localStorage.removeItem(storeKey);
    } catch {}
  };
  return (
    <form
      action={action}
      onSubmit={(e) => {
        dropDraft();
        keepValues(action)(e);
      }}
      className="space-y-5 px-4 py-4 md:px-4"
    >
      <input type="hidden" name="board" value={board.id} />
      {restored && (
        <Banner
          role="status"
          status="info"
          title={t("이 기기에 임시 저장한 글을 불러왔어요.")}
          endContent={
            <Button
              label={t("지우고 새로 쓰기")}
              variant="ghost"
              onClick={() => {
                setTitle("");
                setBody("");
                setRestored(false);
                dropDraft();
              }}
            />
          }
        />
      )}
      <input type="hidden" name="space" value={space} />

      <Card padding={3}>
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-element)] text-white" style={{ background: board.color }}>
            <Icon name={board.icon} size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold">{space === "lounge" ? t("{country} 라운지", { country: countryLabel }) : t(board.ko)}</h1>
            <p className="truncate text-xs text-[var(--color-text-secondary)]">{t(board.desc)}</p>
          </div>
          {changeHref && <Button href={changeHref} label={t("게시판 바꾸기")} variant="ghost" className="shrink-0" />}
        </div>
      </Card>

      {/* Radios that wrap: a SegmentedControl cut longer translations ("Cần lời khuy…") on phones. */}
      <RadioList label={t("말머리")} htmlName="kind" value={tagId} onChange={setTagId} orientation="horizontal">
        {board.tags.map((tg) => (
          <RadioListItem key={tg.id} value={tg.id} label={t(tg.ko)} />
        ))}
      </RadioList>

      <div>
        <TextInput
          label={t("제목")}
          htmlName="title"
          value={title}
          onChange={(x) => {
            setTitle(x);
            saveDraft({ title: x, body });
            findSimilar(x);
          }}
          placeholder={t(board.titleHint)}
          width="100%"
          {...native({ required: true, minLength: 2, maxLength: 120 })}
        />
        {similar.length > 0 && (
          <Banner role="status" status="info" title={t("비슷한 글이 있어요. 먼저 읽어 보세요.")} collapsible={false} className="mt-2">
            <ul className="space-y-1 text-sm">
              {similar.map((p) => (
                <li key={p.id}>
                  <Link href={`/posts/${p.id}`} className="text-primary underline">
                    {p.title}
                  </Link>{" "}
                  <span className="text-xs text-[var(--color-text-secondary)]">{p.solved ? t("해결됨") : t("댓글 {n}", { n: p.comments })}</span>
                </li>
              ))}
            </ul>
          </Banner>
        )}
      </div>

      {board.extra === "market" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {tagId !== "free" && (
            <InputGroup label={t("가격")}>
              {/* Read with the group label: "가격 원". */}
              <TextField name="price" label={t("원")} inputMode="numeric" defaultValue={v.price} placeholder="30000" {...native({ required: true })} />
              <InputGroupText>{t("원")}</InputGroupText>
            </InputGroup>
          )}
          <TextField name="place" label={t("거래 희망 동네")} defaultValue={v.place} placeholder={t("예: 마포구 합정역")} width="100%" {...native({ maxLength: 80 })} />
        </div>
      )}

      {board.extra === "event" && (
        <div className="grid gap-3 sm:grid-cols-3">
          {/* The browser's own date picker, as before: it speaks the member's language. The value posts as YYYY-MM-DD. */}
          <div>
            <DateInput label={t("시작일")} value={(startsOn || undefined) as Day} onChange={(x) => setStartsOn(x ?? "")} presentation="native" format="system_date" placeholder="YYYY-MM-DD" hasClear width="100%" />
            <input type="hidden" name="starts_on" value={startsOn} />
          </div>
          <div>
            <DateInput label={t("종료일")} value={(endsOn || undefined) as Day} onChange={(x) => setEndsOn(x ?? "")} presentation="native" format="system_date" placeholder="YYYY-MM-DD" hasClear width="100%" />
            <input type="hidden" name="ends_on" value={endsOn} />
          </div>
          <TextField name="place" label={t("장소")} defaultValue={v.place} placeholder={t("예: 성수동")} width="100%" {...native({ maxLength: 80 })} />
        </div>
      )}

      <div>
        <TextArea
          label={t("본문")}
          description={t("이름, 연락처, 상세 주소는 적지 마세요.")}
          htmlName="body"
          value={body}
          onChange={(x) => {
            setBody(x);
            saveDraft({ title, body: x });
          }}
          rows={9}
          maxLength={5000}
          placeholder={t(board.bodyHint)}
          width="100%"
          {...native({ required: true, minLength: 2 })}
        />
        {pii.length > 0 && (
          <Banner
            role="alert"
            status="error"
            title={t("개인정보가 보여요: {kinds}. 올리기 전에 지워 주세요.", { kinds: pii.map((k) => t(k)).join(", ") })}
            className="mt-2"
          />
        )}
      </div>

      {ai && (
        <AiCheck
          board={board}
          space={space}
          canMove={Boolean(storeKey)}
          read={() => ({ title, body })}
          setTitle={(x) => {
            setTitle(x);
            saveDraft({ title: x, body });
          }}
        />
      )}

      <PhotoPicker existing={images} reset={state} />

      <details className="rounded-[var(--radius-container)] border border-[var(--color-border)] bg-[var(--color-background-card)] p-4" open={!!state.error}>
        <summary className="-my-1 cursor-pointer py-2 text-sm font-bold">{askVisa ? t("지역 · 체류자격 · 원문 언어") : t("지역 · 원문 언어")}</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {askVisa && (
            <div className="sm:col-span-2">
              <SelectField
                name="visa"
                label={t("체류자격 (선택)")}
                description={t("체류자격에 따라 답이 달라지는 질문에만 골라 주세요. 국적·지역과 함께 보이니 꼭 필요할 때만 밝혀요.")}
                defaultValue={v.visa ?? ""}
                options={[{ value: "", label: t("밝히지 않음") }, ...VISAS.map((x) => ({ value: x.id, label: t(x.ko) }))]}
                width="100%"
              />
            </div>
          )}
          <SelectField
            name="region"
            label={t("지역")}
            defaultValue={v.region ?? ""}
            options={[{ value: "", label: t("지역 무관") }, ...REGIONS.map((r) => ({ value: r.id, label: t(r.ko) }))]}
            width="100%"
          />
          {/* Names come from the server: Node and browser ICU data can disagree and break hydration. */}
          <SelectField name="lang" label={t("원문 언어")} defaultValue={v.lang} options={langs.map((l) => ({ value: l.code, label: l.name }))} width="100%" />
        </div>
      </details>

      <p className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
        <Icon name="lock" size={13} />
        {t("공개")}: <Flag code={nationality} h={11} /> {countryLabel} · {t("글쓴이")} — {t("이메일은 공개되지 않아요.")}
      </p>
      <ErrorLine error={state.error} />
      <Button type="submit" variant="primary" size="lg" width="100%" label={pending ? t("올리는 중…") : submitLabel} isLoading={pending} />
    </form>
  );
}

export function CommentForm({ action: serverAction, parent }: { action: (s: Result, f: FormData) => Promise<Result>; parent?: string }) {
  const t = useT();
  const [body, setBody] = useState("");
  // The box empties as soon as the comment is sent, and a rejected comment comes back so it can be fixed.
  // Clearing after the reply instead wiped whatever was typed next: the action settles after the refreshed
  // thread is already on screen.
  const [state, action, pending] = useActionState(async (s: Result, f: FormData) => {
    const r = await serverAction(s, f);
    if (r.error) setBody((cur) => cur || String(f.get("body") ?? ""));
    return r;
  }, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        keepValues(action)(e);
        setBody("");
      }}
      className="space-y-2"
    >
      {parent && <input type="hidden" name="parent" value={parent} />}
      <TextArea
        label={parent ? t("답글") : t("댓글")}
        isLabelHidden
        htmlName="body"
        value={body}
        onChange={setBody}
        maxLength={2000}
        rows={parent ? 2 : 3}
        placeholder={parent ? t("이 댓글에 답글 달기") : t("겪어 본 상황과 조건을 함께 적어 주면 더 도움이 돼요.")}
        width="100%"
        {...native({ required: true })}
      />
      <ErrorLine error={state.error} />
      <Button type="submit" variant="primary" size="lg" label={pending ? t("등록 중…") : parent ? t("답글 달기") : t("댓글 달기")} isLoading={pending} />
    </form>
  );
}

export function ReportForm({ post, comment }: { post?: string; comment?: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(reportContent, {});
  if (state.ok) {
    return (
      <Card role="status" className="border-l-4 border-l-primary bg-soft/60">
        <p className="font-display text-lg font-bold">{t("신고가 접수됐어요")}</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t("운영자가 확인한 뒤 처리 상태를 알려 드려요.")}</p>
        <Button href="/settings#reports" label={t("내 신고 보기")} variant="secondary" className="mt-3" />
      </Card>
    );
  }
  return (
    <Card className="border-l-4 border-l-red-700">
      <form action={action} onSubmit={keepValues(action)} className="space-y-4">
        {post && <input type="hidden" name="post" value={post} />}
        {comment && <input type="hidden" name="comment" value={comment} />}
        <div className="flex items-end gap-3">
          <span className="mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-red-700 text-white" aria-hidden="true">
            <Icon name="siren" size={18} />
          </span>
          {/* No preselected reason: the server asks for one if it is left empty. */}
          <SelectField
            name="reason"
            label={t("사유")}
            placeholder={t("사유를 고르세요")}
            options={REPORT_REASONS.map((r) => ({ value: r.id, label: t(r.ko) }))}
            width="100%"
          />
        </div>
        <TextAreaField name="details" label={t("자세한 내용 (선택)")} rows={4} maxLength={1000} width="100%" />
        <ErrorLine error={state.error} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" size="lg" label={t("신고 보내기")} isLoading={pending} />
          <Button href={post ? `/posts/${post}` : "/feed"} variant="secondary" size="lg" label={t("취소")} />
        </div>
      </form>
    </Card>
  );
}

export function NationalityForm({ current, countries }: { current: string; countries: { code: string; name: string }[] }) {
  const t = useT();
  const [state, action, pending] = useActionState(updateNationality, {});
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <SelectField name="nationality" label={t("공개 국적")} defaultValue={current} options={countries.map((c) => ({ value: c.code, label: c.name }))} width="100%" />
        </div>
        <Button type="submit" variant="secondary" label={t("저장")} isLoading={pending} />
      </div>
      <p className="text-xs text-[var(--color-text-secondary)]">{t("국적은 내 모든 글에 공개되고, 30일에 한 번 바꿀 수 있어요.")}</p>
      <ErrorLine error={state.error} />
      {state.ok && <p className="text-sm font-semibold text-primary">{t("저장했어요.")}</p>}
    </form>
  );
}

/** Shown to the author of hidden content: ask once for a second look, then see where it stands. */
export function AppealForm({ post, comment, status }: { post?: string; comment?: string; status: string | null }) {
  const t = useT();
  const [state, action, pending] = useActionState(appeal, {});
  if (status === "upheld") return <p className="mt-2 text-xs font-semibold text-red-800">{t("재심 결과: 운영 정책에 맞지 않아 가림을 유지했어요.")}</p>;
  if (status === "received" || state.ok)
    return (
      <p role="status" className="mt-2 text-xs font-semibold text-primary">
        {t("재심을 접수했어요. 운영자가 다시 확인하면 결과가 여기에 표시돼요.")}
      </p>
    );
  return (
    <details className="mt-2 text-sm not-italic" open={!!state.error}>
      <summary className="inline-flex h-11 cursor-pointer items-center font-bold text-primary">{t("재심 요청하기")}</summary>
      <form action={action} onSubmit={keepValues(action)} className="mt-2 space-y-2 text-left">
        {post && <input type="hidden" name="post" value={post} />}
        {comment && <input type="hidden" name="comment" value={comment} />}
        <TextAreaField
          name="reason"
          label={t("왜 다시 봐야 하는지 적어 주세요")}
          description={t("재심은 글마다 한 번 요청할 수 있어요.")}
          rows={3}
          maxLength={1000}
          width="100%"
          {...native({ required: true, minLength: 10 })}
        />
        <ErrorLine error={state.error} />
        <Button type="submit" variant="primary" label={t("재심 요청 보내기")} isLoading={pending} />
      </form>
    </details>
  );
}
