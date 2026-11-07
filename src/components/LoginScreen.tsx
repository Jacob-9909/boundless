"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import { completeSignup, sendCode, setLang, verifyCode } from "@/app/actions";
import { CULTURES, DEFAULT_CULTURE, cultureOf, themeVars, type Culture } from "@/lib/cultures";
import { translator, type Lang } from "@/lib/i18n";
import { Icon } from "./Icon";
import { Flag, Logo, NationalityChip, btn, field, labelCls } from "./ui";

type Step = "email" | "code" | "profile";
const PICKER: Culture[] = [...CULTURES, DEFAULT_CULTURE];

// Remember the pick on this device so the login screen opens in the same culture next time.
function saveCulture(code: string) {
  document.cookie = `culture=${code}; path=/; max-age=31536000; samesite=lax`;
}

export function LoginScreen({ lang, initial, next, countries }: { lang: Lang; initial: string; next: string; countries: { code: string; name: string }[] }) {
  const t = translator(lang);
  const router = useRouter();
  const [culture, setCulture] = useState(() => cultureOf(initial));
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [nationality, setNationality] = useState(initial === "XX" ? "" : initial);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const nameOf = new Map(countries.map((c) => [c.code, c.name]));
  const strip = useRef<HTMLUListElement>(null);

  // On phones the picker is a horizontal strip: keep the chosen culture in view.
  useEffect(() => {
    const ul = strip.current;
    const li = ul?.querySelector<HTMLElement>("[aria-checked=true]")?.parentElement;
    if (ul && li && ul.scrollWidth > ul.clientWidth) ul.scrollLeft = li.offsetLeft - ul.clientWidth / 2 + li.clientWidth / 2;
  }, [culture.code]);

  function pick(c: Culture) {
    setCulture(c);
    if (c.code !== "XX") setNationality(c.code);
    saveCulture(c.code);
  }

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      setError(null);
      await fn();
    });

  const done = () => {
    router.replace(next);
    router.refresh();
  };

  const onEmail = () =>
    run(async () => {
      const r = await sendCode(email);
      if (r.error) return setError(r.error);
      setDevCode(r.devCode ?? null);
      setStep("code");
    });

  const onCode = () =>
    run(async () => {
      const r = await verifyCode(email, code);
      if (r.error) return setError(r.error);
      if (r.next === "done") done();
      else setStep("profile");
    });

  const onProfile = () =>
    run(async () => {
      const r = await completeSignup(nationality, agreed);
      if (r.error) return setError(r.error);
      done();
    });

  return (
    <div style={themeVars(culture) as CSSProperties} className="min-h-screen bg-paper text-ink lg:grid lg:grid-cols-[1.15fr_1fr]">
      {/* Hero: re-skinned with the chosen culture's colors, pattern, script and greeting */}
      <section className="relative flex min-h-[46vh] flex-col overflow-hidden bg-primary px-5 pt-4 pb-8 text-paper transition-colors duration-500 lg:min-h-screen lg:px-10">
        <div key={`p-${culture.code}`} className="bg-pattern animate-fade-in absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" aria-hidden="true" />

        <div className="relative flex items-center justify-between">
          <Link href="/" className="text-paper" aria-label="Boundless home">
            <Logo />
          </Link>
          <form action={setLang.bind(null, lang === "ko" ? "en" : "ko")}>
            <button className="inline-flex h-9 items-center gap-1 rounded-full bg-white/15 px-3 text-[13px] font-bold backdrop-blur hover:bg-white/25" aria-label={t("화면 언어 바꾸기")}>
              <Icon name="globe" size={16} />
              {lang.toUpperCase()}
            </button>
          </form>
        </div>

        <div key={`h-${culture.code}`} className="animate-fade-in relative mt-auto pt-10">
          <p className="station-label flex items-center gap-1.5 opacity-90">
            {culture.code === "XX" ? <Icon name="globe" size={14} /> : <Flag code={culture.code} h={12} />}
            {culture.native}
          </p>
          <h1 className={`mt-2 font-culture text-4xl leading-[1.12] text-balance [overflow-wrap:anywhere] sm:text-5xl lg:text-6xl ${culture.code === "XX" ? "font-extrabold" : ""}`}>{culture.greet}</h1>
          {/* Default theme has no home language, so its line follows the UI language. */}
          <p className="mt-3 font-culture text-xl opacity-95 sm:text-2xl">{culture.code === "XX" ? t(culture.line) : culture.line}</p>
          <p className="mt-5 max-w-md text-sm opacity-85">{t("Boundless는 한국에 사는 모든 외국인이 생활 정보를 찾고, 익명으로 묻고, 경험을 나누는 곳이에요.")}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1 text-xs backdrop-blur">
            <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
            {culture.motif[lang]}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-lg px-5 py-6 lg:flex lg:flex-col lg:justify-center lg:py-10">
        <h2 className="font-display text-xl font-extrabold">{t("어디에서 오셨나요?")}</h2>
        <p className="mt-1 text-sm opacity-70">{t("고른 문화에 맞춰 화면이 바뀌어요. 국적은 가입할 때 따로 정해요.")}</p>
        <ul ref={strip} className="-mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0" role="radiogroup" aria-label={t("어디에서 오셨나요?")}>
          {PICKER.map((c) => {
            const on = c.code === culture.code;
            return (
              <li key={c.code} className="w-[76px] shrink-0 lg:w-auto">
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => pick(c)}
                  title={c.code === "XX" ? t("다른 나라") : nameOf.get(c.code)}
                  className={`flex w-full flex-col items-center gap-1.5 rounded-xl border-2 px-1 pt-2.5 pb-2 transition ${on ? "border-primary bg-soft shadow-sm" : "border-transparent bg-white hover:border-ink/15"}`}
                >
                  {c.code === "XX" ? <Icon name="globe" size={22} className="h-[22px] text-primary" /> : <Flag code={c.code} h={22} />}
                  <span className="w-full truncate text-center text-xs font-semibold">{c.code === "XX" ? t("다른 나라") : c.native}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:p-6">
          {step === "email" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onEmail();
              }}
              className="space-y-3"
            >
              <p className="font-display text-lg font-extrabold">{t("이메일로 시작하기")}</p>
              <div>
                <label htmlFor="email" className={labelCls}>
                  {t("이메일")}
                </label>
                <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
                <p className="mt-1 text-xs opacity-70">{t("이메일은 로그인에만 쓰고 다른 사람에게 보이지 않아요.")}</p>
              </div>
              <ErrorBox error={error} t={t} />
              <button disabled={pending} className={`${btn} w-full`}>
                {pending ? t("보내는 중…") : t("로그인 코드 받기")}
              </button>
              <p className="text-center text-xs opacity-60">
                <Link href="/" className="underline">
                  {t("가입하지 않고 둘러보기")}
                </Link>
              </p>
            </form>
          )}

          {step === "code" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onCode();
              }}
              className="space-y-3"
            >
              <p className="font-display text-lg font-extrabold">{t("메일함을 확인하세요")}</p>
              <p className="text-sm opacity-80">{t("{email} 로 6자리 코드를 보냈어요.", { email })}</p>
              {devCode && (
                <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">
                  {t("개발·데모 계정이라 메일 대신 코드를 보여 줘요")} · <b className="tracking-widest">{devCode}</b>
                </p>
              )}
              <div>
                <label htmlFor="code" className={labelCls}>
                  {t("6자리 코드")}
                </label>
                <input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className={`${field} text-center text-2xl tracking-[0.5em]`}
                />
              </div>
              <ErrorBox error={error} t={t} />
              <button disabled={pending} className={`${btn} w-full`}>
                {t("확인")}
              </button>
              <div className="flex justify-between text-xs">
                <button type="button" onClick={() => setStep("email")} className="underline opacity-70">
                  {t("이메일 바꾸기")}
                </button>
                <button type="button" onClick={onEmail} disabled={pending} className="underline opacity-70">
                  {t("코드 다시 받기")}
                </button>
              </div>
            </form>
          )}

          {step === "profile" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onProfile();
              }}
              className="space-y-4"
            >
              <p className="font-display text-lg font-extrabold">{t("마지막 단계예요")}</p>
              <div>
                <label htmlFor="nationality" className={labelCls}>
                  {t("공개할 국적 (하나)")}
                </label>
                <select
                  id="nationality"
                  required
                  value={nationality}
                  onChange={(e) => {
                    setNationality(e.target.value);
                    setCulture(cultureOf(e.target.value));
                  }}
                  className={field}
                >
                  <option value="" disabled>
                    {t("국적을 고르세요")}
                  </option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {nationality && (
                <div className="rounded-2xl bg-soft/60 p-4 text-sm">
                  <p className="font-bold">{t("다른 사람에게는 이렇게 보여요")}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="font-bold">{t("글쓴이")}</span>
                    <NationalityChip code={nationality} lang={lang} />
                  </div>
                  <p className="mt-2 text-xs opacity-70">{t("글마다 다른 익명 호칭이 붙고, 이메일은 비공개예요.")}</p>
                </div>
              )}
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
                <span>{t("만 14세 이상이며, 개인정보를 올리지 않는 커뮤니티 규칙에 동의해요.")}</span>
              </label>
              <ErrorBox error={error} t={t} />
              <button disabled={pending} className={`${btn} w-full`}>
                {t("가입 완료")}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function ErrorBox({ error, t }: { error: string | null; t: (s: string) => string }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-800">
      {t(error)}
    </p>
  );
}
