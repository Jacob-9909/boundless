"use client";

import Link from "next/link";
import { useActionState } from "react";
import { reportContent, updateNationality, type Result } from "@/app/actions";
import { KINDS, REGIONS, REPORT_REASONS, TOPICS, translator, type Lang } from "@/lib/i18n";
import { Flag, btn, btnGhost, field, labelCls } from "./ui";

function ErrorLine({ error, lang }: { error?: string; lang: Lang }) {
  if (!error) return null;
  return (
    <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-800">
      {translator(lang)(error)}
    </p>
  );
}

type PostState = Result & { values?: Record<string, string> };

/** New post and edit share this form; the server action decides which. */
export function WriteForm({
  action: serverAction,
  submitLabel,
  initial,
  lang,
  langs,
  nationality,
  countryLabel,
}: {
  action: (s: PostState, f: FormData) => Promise<PostState>;
  submitLabel: string;
  initial: Record<string, string>;
  lang: Lang;
  langs: { code: string; name: string }[];
  nationality: string;
  countryLabel: string;
}) {
  const t = translator(lang);
  const [state, action, pending] = useActionState(serverAction, {});
  const v: Record<string, string> = state.values ?? initial;
  return (
    <form action={action} className="space-y-4 px-4 py-4">
      <div className="rounded-2xl border border-primary/25 bg-soft/50 p-4 text-sm">
        <p className="font-bold">{t("다른 사람에게는 이렇게 보여요")}</p>
        <p className="mt-1">
          <span className="inline-flex items-center gap-1.5">
            {t("공개")}: <Flag code={nationality} h={12} /> {countryLabel} · {t("글쓴이")}
          </span>
        </p>
        <p className="opacity-70">{t("비공개")}: {t("이메일")}</p>
      </div>
      <div>
        <label htmlFor="title" className={labelCls}>
          {t("제목")}
        </label>
        <input id="title" name="title" required minLength={2} maxLength={120} defaultValue={v.title} className={field} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="topic" className={labelCls}>
            {t("주제")}
          </label>
          <select id="topic" name="topic" required defaultValue={v.topic ?? ""} className={field}>
            <option value="" disabled>
              {t("주제를 고르세요")}
            </option>
            {TOPICS.map((tp) => (
              <option key={tp.id} value={tp.id}>
                {t(tp.ko)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="kind" className={labelCls}>
            {t("글 종류")}
          </label>
          <select id="kind" name="kind" required defaultValue={v.kind ?? "question"} className={field}>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {t(k.ko)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
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
      <div>
        <label htmlFor="body" className={labelCls}>
          {t("본문")}
        </label>
        <textarea id="body" name="body" required minLength={2} maxLength={5000} rows={8} defaultValue={v.body} className={field} />
        <p className="mt-1 text-xs opacity-70">{t("이름, 연락처, 상세 주소는 적지 마세요. 동네나 구 정도면 충분해요.")}</p>
      </div>
      <ErrorLine error={state.error} lang={lang} />
      <button disabled={pending} className={`${btn} w-full`}>
        {pending ? t("올리는 중…") : submitLabel}
      </button>
    </form>
  );
}

export function CommentForm({ action: serverAction, lang, parent }: { action: (s: Result, f: FormData) => Promise<Result>; lang: Lang; parent?: string }) {
  const t = translator(lang);
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
      <ErrorLine error={state.error} lang={lang} />
      <button disabled={pending} className={btn}>
        {pending ? t("등록 중…") : parent ? t("답글 달기") : t("댓글 달기")}
      </button>
    </form>
  );
}

export function ReportForm({ post, comment, lang }: { post?: string; comment?: string; lang: Lang }) {
  const t = translator(lang);
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
    <form action={action} className="space-y-4 rounded-2xl border-l-4 border-primary bg-white p-5">
      {post && <input type="hidden" name="post" value={post} />}
      {comment && <input type="hidden" name="comment" value={comment} />}
      <div>
        <label htmlFor="reason" className={labelCls}>
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
      <ErrorLine error={state.error} lang={lang} />
      <div className="flex gap-2">
        <button disabled={pending} className={btn}>
          {t("신고 보내기")}
        </button>
        <Link href={post ? `/posts/${post}` : "/"} className={btnGhost}>
          {t("취소")}
        </Link>
      </div>
    </form>
  );
}

export function NationalityForm({ lang, current, countries }: { lang: Lang; current: string; countries: { code: string; name: string }[] }) {
  const t = translator(lang);
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
        <button disabled={pending} className={btn}>
          {t("저장")}
        </button>
      </div>
      <p className="text-xs opacity-70">{t("국적은 내 모든 글에 공개되고, 30일에 한 번 바꿀 수 있어요.")}</p>
      <ErrorLine error={state.error} lang={lang} />
      {state.ok && <p className="text-sm font-semibold text-primary">{t("저장했어요.")}</p>}
    </form>
  );
}
