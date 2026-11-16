"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Link as TextLink } from "@astryxdesign/core/Link";
import { Selector } from "@astryxdesign/core/Selector";
import { TextInput } from "@astryxdesign/core/TextInput";
import { completeSignup, demoLogin, sendCode, setLang, verifyCode } from "@/app/actions";
import { CULTURES, DEFAULT_CULTURE, cultureOf, themeVars, type Culture } from "@/lib/cultures";
import { LANG_NAMES, toLang, type Lang } from "@/lib/i18n";
import { useT } from "./I18n";
import { Icon } from "./Icon";
import { LangMenu } from "./LangMenu";
import { Flag, Landmark, Logo, NationalityChip } from "./ui";

type Step = "email" | "code" | "profile";
const PICKER: Culture[] = [...CULTURES, DEFAULT_CULTURE];

// Remember the pick on this device so the login screen opens in the same culture next time.
function saveCulture(code: string) {
  document.cookie = `culture=${code}; path=/; max-age=31536000; samesite=lax`;
}

export function LoginScreen({
  lang,
  initial,
  next,
  countries,
  demo,
}: {
  lang: Lang;
  initial: string;
  next: string;
  countries: { code: string; name: string }[];
  demo: boolean;
}) {
  const t = useT();
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

  // Astryx's loading button stays focusable (aria-disabled), so Enter in a field could resubmit mid-request.
  const run = (fn: () => Promise<void>) => {
    if (pending) return;
    start(async () => {
      setError(null);
      await fn();
    });
  };

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
      // New members set up their profile first: the avatar step can be skipped, and then they go on to `next`.
      router.replace(`/settings/avatar?welcome=1&next=${encodeURIComponent(next)}`);
      router.refresh();
    });

  return (
    <main style={themeVars(culture)} className="culture min-h-dvh bg-paper text-ink lg:grid lg:grid-cols-[1.15fr_1fr]">
      {/* Hero: re-skinned with the chosen culture's colors, pattern, script and greeting */}
      {/* z-10 + no overflow clip on the section, so the language menu can drop below the hero */}
      <section className="relative z-10 flex min-h-[46svh] flex-col bg-primary px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-8 text-paper transition-colors duration-500 lg:min-h-screen lg:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div key={`p-${culture.code}`} className="bg-pattern animate-fade-in absolute inset-0 opacity-30" />
          <div key={`l-${culture.code}`} className="animate-fade-in absolute inset-x-0 bottom-0">
            <Landmark culture={culture} className="ml-auto h-40 w-auto opacity-80 lg:h-56" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        </div>

        <div className="relative flex items-center justify-between">
          <Link href="/" className="text-paper" aria-label="Boundless home">
            <Logo />
          </Link>
          <LangMenu lang={lang} label={t("화면 언어 바꾸기")} note={t("한국어와 영어 밖의 언어는 기계 번역이라 어색한 문장이 있을 수 있어요. 검수하고 있어요.")} tone="glass" compact />
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
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <p className="inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1 text-xs backdrop-blur">
              <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
              {t(culture.motif)}
            </p>
            {/* Picked a culture whose language isn't on screen: one tap to read everything in it. */}
            {(() => {
              const own = toLang(culture.langs[0]);
              return own && own !== lang ? (
                <form action={setLang.bind(null, own)}>
                  {/* A white chip on the culture-colored hero: primary with the accent swapped for white. */}
                  <Button
                    type="submit"
                    variant="primary"
                    label={t("{lang}로 보기", { lang: LANG_NAMES[own] })}
                    icon={<Icon name="globe" size={14} />}
                    className="rounded-full [--color-accent:#fff] [--color-on-accent:var(--c-ink)]"
                  />
                </form>
              ) : null;
            })()}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-lg px-5 py-6 lg:flex lg:flex-col lg:justify-center lg:py-10">
        <h2 className="font-display text-xl font-extrabold">{t("어디에서 오셨나요?")}</h2>
        <p className="mt-1 text-sm opacity-70">{t("고른 문화에 맞춰 화면이 바뀌어요. 국적은 가입할 때 따로 정해요.")}</p>
        <ul ref={strip} className="relative -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0" role="radiogroup" aria-label={t("어디에서 오셨나요?")}>
          {PICKER.map((c) => {
            const on = c.code === culture.code;
            return (
              <li key={c.code} role="none" className="w-[76px] shrink-0 lg:w-auto">
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => pick(c)}
                  title={c.code === "XX" ? t("다른 나라") : nameOf.get(c.code)}
                  className={`flex h-full w-full flex-col items-center gap-1.5 rounded-[var(--radius-element)] border-2 px-1 pt-2.5 pb-2 transition ${on ? "border-primary bg-soft shadow-sm" : "border-transparent bg-[var(--color-background-card)] hover:border-[var(--color-border-emphasized)]"}`}
                >
                  {c.code === "XX" ? <Icon name="globe" size={22} className="h-[22px] text-primary" /> : <Flag code={c.code} h={22} />}
                  {/* Two lines instead of an ellipsis ("United States" was cut off in a 76px tile); 11px so one long word
                      like "Oʻzbekiston" still fits on a line. overflow-wrap is only the last resort. */}
                  <span className="line-clamp-2 w-full text-center text-[11px] leading-tight font-semibold [overflow-wrap:anywhere] lg:text-xs">{c.code === "XX" ? t("다른 나라") : c.native}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <Card className="mt-6">
          {step === "email" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onEmail();
              }}
              className="space-y-3"
            >
              <p className="font-display text-lg font-extrabold">{t("이메일로 시작하기")}</p>
              <TextInput
                type="email"
                label={t("이메일")}
                description={t("이메일은 로그인에만 쓰고 다른 사람에게 보이지 않아요.")}
                autoComplete="email"
                enterKeyHint="send"
                size="lg"
                width="100%"
                value={email}
                onChange={setEmail}
              />
              <ErrorBox error={error} t={t} />
              <Button type="submit" variant="primary" size="lg" width="100%" isLoading={pending} label={pending ? t("보내는 중…") : t("로그인 코드 받기")} />
              <p className="text-center text-xs">
                <TextLink href="/feed" type="inherit" color="secondary" hasUnderline className="inline-flex min-h-11 items-center">
                  {t("가입하지 않고 둘러보기")}
                </TextLink>
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
              {/* e2e/flow.mjs reads the code from b.tracking-widest. */}
              {devCode && <Banner status="info" title={t("개발·데모 계정이라 메일 대신 코드를 보여 줘요")} description={<b className="text-lg tracking-widest">{devCode}</b>} />}
              <TextInput
                label={t("6자리 코드")}
                inputMode="numeric"
                autoComplete="one-time-code"
                enterKeyHint="done"
                hasAutoCorrect={false}
                size="lg"
                width="100%"
                value={code}
                onChange={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                controlClassName="[&_input]:text-center [&_input]:text-2xl [&_input]:tracking-[0.5em]"
              />
              <ErrorBox error={error} t={t} />
              <Button type="submit" variant="primary" size="lg" width="100%" isLoading={pending} label={t("확인")} />
              <div className="flex justify-between">
                <Button variant="ghost" label={t("이메일 바꾸기")} onClick={() => setStep("email")} />
                <Button variant="ghost" label={t("코드 다시 받기")} onClick={onEmail} isDisabled={pending} />
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
              <Selector
                label={t("공개할 국적 (하나)")}
                placeholder={t("국적을 고르세요")}
                options={countries.map((c) => ({ value: c.code, label: c.name }))}
                hasSearch
                searchPlaceholder={t("검색")}
                emptySearchText={t("검색 결과가 없어요")}
                presentation="adaptive"
                size="lg"
                width="100%"
                value={nationality || undefined}
                onChange={(v) => {
                  setNationality(v);
                  setCulture(cultureOf(v));
                }}
              />
              {nationality && (
                <div className="rounded-[var(--radius-container)] bg-soft/60 p-4 text-sm">
                  <p className="font-bold">{t("다른 사람에게는 이렇게 보여요")}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="font-bold">{t("글쓴이")}</span>
                    <NationalityChip code={nationality} lang={lang} />
                  </div>
                  <p className="mt-2 text-xs opacity-70">{t("글마다 다른 익명 호칭이 붙고, 이메일은 비공개예요.")}</p>
                </div>
              )}
              <CheckboxInput label={t("만 14세 이상이며, 개인정보를 올리지 않는 커뮤니티 규칙에 동의해요.")} value={agreed} onChange={setAgreed} />
              <TextLink href="/policy" target="_blank" type="inherit" weight="bold" hasUnderline className="-mt-2 inline-flex min-h-11 items-center text-xs">
                {t("운영 정책 보기")} <Icon name="external" size={12} className="inline" />
              </TextLink>
              <ErrorBox error={error} t={t} />
              <Button type="submit" variant="primary" size="lg" width="100%" isLoading={pending} label={t("가입 완료")} />
            </form>
          )}
        </Card>

        {demo && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[var(--radius-container)] border border-dashed border-primary/40 bg-soft/40 p-4">
            {/* min-w-48: on phones the button drops to its own line instead of squeezing this text to one word per line. */}
            <div className="min-w-48 flex-1">
              <p className="text-sm font-bold">{t("심사위원·체험용")}</p>
              <p className="text-xs opacity-70">{t("이메일 인증 없이 이 나라의 샘플 이웃으로 둘러봐요. 모든 데이터는 가상이에요.")}</p>
            </div>
            <form action={demoLogin.bind(null, culture.code)}>
              <Button
                type="submit"
                variant="primary"
                label={t("샘플 계정으로 입장")}
                icon={culture.code === "XX" ? <Icon name="globe" size={16} /> : <Flag code={culture.code} h={12} />}
              />
            </form>
          </div>
        )}
      </section>
    </main>
  );
}

function ErrorBox({ error, t }: { error: string | null; t: (s: string) => string }) {
  if (!error) return null;
  return <Banner role="alert" status="error" title={t(error)} />;
}
