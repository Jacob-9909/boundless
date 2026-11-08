"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { aiCheckDraft, appeal, countView, reportContent, similarPosts, updateNationality, type PostState, type Result } from "@/app/actions";
import type { DraftCheck } from "@/lib/ai";
import { boardOf, type Board } from "@/lib/boards";
import { REGIONS, REPORT_REASONS, VISAS } from "@/lib/i18n";
import { findPII } from "@/lib/pii";
import { Icon } from "./Icon";
import { useT } from "./I18n";
import { Flag, btn, btnGhost, field, labelCls } from "./ui";

function ErrorLine({ error }: { error?: string }) {
  const t = useT();
  if (!error) return null;
  return (
    <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-800">
      {t(error)}
    </p>
  );
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

/** Up to four photos: existing ones (edit) can be unticked, new ones are shrunk in the browser before upload. */
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
  const thumb = "relative size-20 overflow-hidden rounded-xl bg-ink/5 ring-1 ring-ink/10";
  return (
    <fieldset>
      <legend className={labelCls}>{t("사진 (선택, 4장까지)")}</legend>
      <div className="flex flex-wrap items-center gap-2">
        {existing.map((im) => {
          const off = drop.includes(im.id);
          return (
            <label key={im.id} className={`${thumb} cursor-pointer ${off ? "opacity-40" : ""}`} title={t("빼기")}>
              {/* eslint-disable-next-line @next/next/no-img-element -- already-uploaded photo served by /api/img */}
              <img src={`/api/img/${im.id}`} alt="" className="size-full object-cover" />
              <input
                type="checkbox"
                name="drop_image"
                value={im.id}
                checked={off}
                onChange={() => setDrop((d) => (off ? d.filter((x) => x !== im.id) : [...d, im.id]))}
                className="absolute top-1 right-1 size-5 accent-red-700"
                aria-label={t("이 사진 빼기")}
              />
            </label>
          );
        })}
        {previews.map((u) => (
          <span key={u} className={thumb}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview (blob: URL) */}
            <img src={u} alt="" className="size-full object-cover" />
          </span>
        ))}
        <label className={`${btnGhost} h-20 cursor-pointer flex-col gap-0.5 px-4 text-xs has-[:focus-visible]:ring-4 ${room <= 0 ? "pointer-events-none opacity-40" : ""}`}>
          <Icon name="image" size={20} />
          {busy ? t("줄이는 중…") : previews.length ? t("다시 고르기") : t("사진 추가")}
          <input ref={input} type="file" name="images" accept="image/*" multiple disabled={room <= 0} onChange={(e) => pick(e.target.files)} className="sr-only" />
        </label>
      </div>
      {note && <p className="mt-1 text-xs font-semibold text-red-700">{note}</p>}
      <p className="mt-1 text-xs opacity-70">{t("얼굴, 외국인등록증, 집 주소가 보이는 사진은 올리지 마세요.")}</p>
    </fieldset>
  );
}

/** New post and edit share this form; the server action decides which. Fields adapt to the board. */
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
    <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 text-violet-950">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-bold text-violet-800 ring-1 ring-violet-300 hover:ring-violet-500 disabled:opacity-60"
      >
        <Icon name="sparkles" size={16} />
        {busy ? t("점검하는 중…") : t("AI로 질문 점검하기")}
      </button>
      <p className="mt-2 text-xs opacity-75">{t("AI 점검은 글을 NVIDIA AI로 보내요. 전화번호·등록번호·이메일은 지우고 보내요.")}</p>
      <div aria-live="polite">
        {res?.error && <p className={`${box} font-bold text-red-700`}>{t(res.error)}</p>}
        {clean && <p className={`${box} font-bold`}>{t("좋아요. 이대로 올려도 충분해요.")}</p>}
        {c && c.privacy.length > 0 && (
          <div className={`${box} rounded-xl bg-red-50 p-3 text-red-900`}>
            <p className="font-bold">{t("올리기 전에 확인해 주세요")}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {c.privacy.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
        )}
        {board2 && (
          <p className={`${box} flex flex-wrap items-center gap-2`}>
            {t("이 내용은 {board} 게시판에 더 잘 맞아요.", { board: t(boardOf(board2).ko) })}
            <button type="button" onClick={() => move(board2)} className="h-9 rounded-lg bg-white px-3 font-bold text-primary ring-1 ring-ink/15">
              {t("옮기기")}
            </button>
          </p>
        )}
        {c?.title && (
          <div className={box}>
            <p className="font-bold">{t("제목 제안")}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-violet-200">{c.title}</span>
              <button type="button" onClick={() => setTitle(c.title!)} className="h-9 rounded-lg px-3 font-bold text-primary hover:bg-white">
                {t("이 제목 쓰기")}
              </button>
            </p>
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
  const [pii, setPii] = useState<string[]>([]);
  const v: Record<string, string> = state.values ?? initial;
  const [tagId, setTagId] = useState(v.kind || board.tags[0].id);
  const [len, setLen] = useState((v.body ?? "").length);
  const form = useRef<HTMLFormElement>(null);
  const [restored, setRestored] = useState(false);
  const [similar, setSimilar] = useState<Awaited<ReturnType<typeof similarPosts>>>([]);
  const lookup = useRef<ReturnType<typeof setTimeout>>(undefined);
  const askVisa = space === "global" && board.group === "life";
  const storeKey = draftKey && `draft:${draftKey}`;
  // New posts only: while the title is typed, show up to 3 posts with similar titles so the answer may already exist.
  const findSimilar = (title: string) => {
    if (!draftKey) return;
    clearTimeout(lookup.current);
    if (title.trim().length < 2) return setSimilar([]);
    lookup.current = setTimeout(() => {
      similarPosts(board.id, space === "lounge", title).then(setSimilar, () => setSimilar([]));
    }, 400);
  };
  const fields = () => {
    const f = form.current?.elements;
    return { title: f?.namedItem("title") as HTMLInputElement | null, body: f?.namedItem("body") as HTMLTextAreaElement | null };
  };
  // Bring back a draft left on this device (closed tab, lost connection), unless the form already has text.
  useEffect(() => {
    if (!storeKey) return;
    let d: { title?: string; body?: string } | null = null;
    try {
      d = JSON.parse(localStorage.getItem(storeKey) ?? "null");
    } catch {}
    const { title, body } = fields();
    if (!d?.body || !title || !body || body.value) return;
    if (!title.value) title.value = d.title ?? "";
    body.value = d.body;
    queueMicrotask(() => {
      setLen(d.body?.length ?? 0);
      setRestored(true);
    });
  }, [storeKey]);
  const saveDraft = () => {
    const { title, body } = fields();
    if (!storeKey || !title || !body) return;
    try {
      localStorage.setItem(storeKey, JSON.stringify({ title: title.value, body: body.value }));
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
      ref={form}
      action={action}
      onInput={() => {
        saveDraft();
        const { title, body } = fields();
        setPii(findPII(`${title?.value ?? ""}\n${body?.value ?? ""}`));
      }}
      onSubmit={dropDraft}
      className="space-y-5 px-4 py-4 md:px-4"
    >
      <input type="hidden" name="board" value={board.id} />
      {restored && (
        <p role="status" className="flex flex-wrap items-center gap-x-2 rounded-xl bg-soft/70 px-3.5 py-2 text-sm">
          {t("이 기기에 임시 저장한 글을 불러왔어요.")}
          <button
            type="button"
            onClick={() => {
              const { title, body } = fields();
              if (title) title.value = "";
              if (body) body.value = "";
              setLen(0);
              setRestored(false);
              dropDraft();
            }}
            className="inline-flex h-8 items-center font-bold text-primary underline"
          >
            {t("지우고 새로 쓰기")}
          </button>
        </p>
      )}
      <input type="hidden" name="space" value={space} />

      <div className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/[.07]">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: board.color }}>
          <Icon name={board.icon} size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold">{space === "lounge" ? t("{country} 라운지", { country: countryLabel }) : t(board.ko)}</h1>
          <p className="truncate text-xs opacity-70">{t(board.desc)}</p>
        </div>
        {changeHref && (
          <Link href={changeHref} className="inline-flex h-9 shrink-0 items-center rounded-lg px-2 text-xs font-bold whitespace-nowrap text-primary hover:bg-soft">
            {t("게시판 바꾸기")}
          </Link>
        )}
      </div>

      <fieldset>
        <legend className={labelCls}>{t("말머리")}</legend>
        <div className="flex flex-wrap gap-2">
          {board.tags.map((tg) => (
            <label
              key={tg.id}
              className={`inline-flex h-10 cursor-pointer items-center rounded-full px-4 text-sm font-bold whitespace-nowrap ring-1 transition has-[:focus-visible]:ring-4 ${tagId === tg.id ? "bg-primary text-paper ring-primary" : "bg-white ring-ink/15 hover:ring-ink/30"}`}
            >
              <input type="radio" name="kind" value={tg.id} checked={tagId === tg.id} onChange={() => setTagId(tg.id)} className="sr-only" />
              {t(tg.ko)}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="title" className={labelCls}>
          {t("제목")}
        </label>
        <input
          id="title"
          name="title"
          required
          minLength={2}
          maxLength={120}
          defaultValue={v.title}
          placeholder={t(board.titleHint)}
          onChange={(e) => findSimilar(e.target.value)}
          className={field}
        />
        {similar.length > 0 && (
          <div role="status" className="mt-2 rounded-xl bg-soft/70 px-3.5 py-2.5 text-sm">
            <p className="font-bold">{t("비슷한 글이 있어요. 먼저 읽어 보세요.")}</p>
            <ul className="mt-1 space-y-1">
              {similar.map((p) => (
                <li key={p.id}>
                  <Link href={`/posts/${p.id}`} className="text-primary underline">
                    {p.title}
                  </Link>{" "}
                  <span className="text-xs opacity-70">
                    {p.solved ? t("해결됨") : t("댓글 {n}", { n: p.comments })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {board.extra === "market" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {tagId !== "free" && (
            <div>
              <label htmlFor="price" className={labelCls}>
                {t("가격")}
              </label>
              <div className="relative">
                <input id="price" name="price" inputMode="numeric" required defaultValue={v.price} placeholder="30000" className={`${field} pr-10`} />
                <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-sm opacity-70">{t("원")}</span>
              </div>
            </div>
          )}
          <div>
            <label htmlFor="place" className={labelCls}>
              {t("거래 희망 동네")}
            </label>
            <input id="place" name="place" maxLength={80} defaultValue={v.place} placeholder={t("예: 마포구 합정역")} className={field} />
          </div>
        </div>
      )}

      {board.extra === "event" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="starts_on" className={labelCls}>
              {t("시작일")}
            </label>
            <input id="starts_on" name="starts_on" type="date" defaultValue={v.starts_on} className={field} />
          </div>
          <div>
            <label htmlFor="ends_on" className={labelCls}>
              {t("종료일")}
            </label>
            <input id="ends_on" name="ends_on" type="date" defaultValue={v.ends_on} className={field} />
          </div>
          <div>
            <label htmlFor="place" className={labelCls}>
              {t("장소")}
            </label>
            <input id="place" name="place" maxLength={80} defaultValue={v.place} placeholder={t("예: 성수동")} className={field} />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="body" className={labelCls}>
          {t("본문")}
        </label>
        <textarea
          id="body"
          name="body"
          required
          minLength={2}
          maxLength={5000}
          rows={9}
          defaultValue={v.body}
          placeholder={t(board.bodyHint)}
          onChange={(e) => setLen(e.target.value.length)}
          className={field}
        />
        <p className="mt-1 flex justify-between text-xs opacity-70">
          <span>{t("이름, 연락처, 상세 주소는 적지 마세요.")}</span>
          <span className="tabular-nums">{len} / 5000</span>
        </p>
        {pii.length > 0 && (
          <p role="alert" className="mt-2 flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
            <Icon name="alert" size={16} className="mt-0.5" />
            {t("개인정보가 보여요: {kinds}. 올리기 전에 지워 주세요.", { kinds: pii.map((k) => t(k)).join(", ") })}
          </p>
        )}
      </div>

      {ai && (
        <AiCheck
          board={board}
          space={space}
          canMove={Boolean(storeKey)}
          read={() => {
            const { title, body } = fields();
            return { title: title?.value ?? "", body: body?.value ?? "" };
          }}
          setTitle={(v) => {
            const { title } = fields();
            if (title) title.value = v;
            saveDraft();
          }}
        />
      )}

      <PhotoPicker existing={images} reset={state} />

      <details className="rounded-2xl bg-white p-4 ring-1 ring-ink/[.07]" open={!!state.error}>
        <summary className="-my-1 cursor-pointer py-2 text-sm font-bold">{askVisa ? t("지역 · 체류자격 · 원문 언어") : t("지역 · 원문 언어")}</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {askVisa && (
            <div className="sm:col-span-2">
              <label htmlFor="visa" className={labelCls}>
                {t("체류자격 (선택)")}
              </label>
              <select id="visa" name="visa" defaultValue={v.visa ?? ""} className={field}>
                <option value="">{t("밝히지 않음")}</option>
                {VISAS.map((x) => (
                  <option key={x.id} value={x.id}>
                    {t(x.ko)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs opacity-70">{t("체류자격에 따라 답이 달라지는 질문에만 골라 주세요. 국적·지역과 함께 보이니 꼭 필요할 때만 밝혀요.")}</p>
            </div>
          )}
          <div>
            <label htmlFor="region" className={labelCls}>
              {t("지역")}
            </label>
            <select id="region" name="region" defaultValue={v.region ?? ""} className={field}>
              <option value="">{t("지역 무관")}</option>
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {t(r.ko)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lang" className={labelCls}>
              {t("원문 언어")}
            </label>
            <select id="lang" name="lang" required defaultValue={v.lang} className={field}>
              {/* Names come from the server: Node and browser ICU data can disagree and break hydration. */}
              {langs.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </details>

      <p className="flex flex-wrap items-center gap-1.5 text-xs opacity-70">
        <Icon name="lock" size={13} />
        {t("공개")}: <Flag code={nationality} h={11} /> {countryLabel} · {t("글쓴이")} — {t("이메일은 공개되지 않아요.")}
      </p>
      <ErrorLine error={state.error} />
      <button disabled={pending} className={`${btn} w-full`}>
        {pending ? t("올리는 중…") : submitLabel}
      </button>
    </form>
  );
}

export function CommentForm({ action: serverAction, parent }: { action: (s: Result, f: FormData) => Promise<Result>; parent?: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(serverAction, {});
  const id = parent ? `reply-${parent}` : "comment";
  return (
    <form action={action} className="space-y-2">
      {parent && <input type="hidden" name="parent" value={parent} />}
      <label htmlFor={id} className="sr-only">
        {parent ? t("답글") : t("댓글")}
      </label>
      <textarea
        id={id}
        name="body"
        required
        maxLength={2000}
        rows={parent ? 2 : 3}
        placeholder={parent ? t("이 댓글에 답글 달기") : t("겪어 본 상황과 조건을 함께 적어 주면 더 도움이 돼요.")}
        className={field}
      />
      <ErrorLine error={state.error} />
      <button disabled={pending} className={btn}>
        {pending ? t("등록 중…") : parent ? t("답글 달기") : t("댓글 달기")}
      </button>
    </form>
  );
}

export function ReportForm({ post, comment }: { post?: string; comment?: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(reportContent, {});
  if (state.ok) {
    return (
      <div className="rounded-2xl border-l-4 border-primary bg-soft/60 p-5" role="status">
        <p className="font-display text-lg font-bold">{t("신고가 접수됐어요")}</p>
        <p className="mt-1 text-sm opacity-80">{t("운영자가 확인한 뒤 처리 상태를 알려 드려요.")}</p>
        <Link href="/settings#reports" className="mt-3 inline-block text-sm font-bold text-primary underline">
          {t("내 신고 보기")}
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4 rounded-2xl border-l-4 border-red-700 bg-white p-5">
      {post && <input type="hidden" name="post" value={post} />}
      {comment && <input type="hidden" name="comment" value={comment} />}
      <div>
        <label htmlFor="reason" className={`${labelCls} flex items-center gap-2`}>
          <span className="flex size-9 items-center justify-center rounded-full bg-red-700 text-white" aria-hidden="true">
            <Icon name="siren" size={18} />
          </span>
          {t("사유")}
        </label>
        <select id="reason" name="reason" required defaultValue="" className={field}>
          <option value="" disabled>
            {t("사유를 고르세요")}
          </option>
          {REPORT_REASONS.map((r) => (
            <option key={r.id} value={r.id}>
              {t(r.ko)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="details" className={labelCls}>
          {t("자세한 내용 (선택)")}
        </label>
        <textarea id="details" name="details" rows={4} maxLength={1000} className={field} />
      </div>
      <ErrorLine error={state.error} />
      <div className="flex gap-2">
        <button disabled={pending} className={btn}>
          {t("신고 보내기")}
        </button>
        <Link href={post ? `/posts/${post}` : "/feed"} className={btnGhost}>
          {t("취소")}
        </Link>
      </div>
    </form>
  );
}

export function NationalityForm({ current, countries }: { current: string; countries: { code: string; name: string }[] }) {
  const t = useT();
  const [state, action, pending] = useActionState(updateNationality, {});
  return (
    <form action={action} className="space-y-2">
      <label htmlFor="nationality" className={labelCls}>
        {t("공개 국적")}
      </label>
      <div className="flex gap-2">
        <select id="nationality" name="nationality" defaultValue={current} className={field}>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <button disabled={pending} className={btnGhost}>
          {t("저장")}
        </button>
      </div>
      <p className="text-xs opacity-70">{t("국적은 내 모든 글에 공개되고, 30일에 한 번 바꿀 수 있어요.")}</p>
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
      <summary className="inline-flex h-8 cursor-pointer items-center font-bold text-primary">{t("재심 요청하기")}</summary>
      <form action={action} className="mt-2 space-y-2">
        {post && <input type="hidden" name="post" value={post} />}
        {comment && <input type="hidden" name="comment" value={comment} />}
        <label htmlFor={`appeal-${post ?? comment}`} className={labelCls}>
          {t("왜 다시 봐야 하는지 적어 주세요")}
        </label>
        <textarea id={`appeal-${post ?? comment}`} name="reason" required minLength={10} maxLength={1000} rows={3} className={field} />
        <p className="text-xs opacity-70">{t("재심은 글마다 한 번 요청할 수 있어요.")}</p>
        <ErrorLine error={state.error} />
        <button disabled={pending} className={`${btn} h-10 text-sm`}>
          {t("재심 요청 보내기")}
        </button>
      </form>
    </details>
  );
}
