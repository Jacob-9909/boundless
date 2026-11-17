"use client";

// A guided tour for sample (demo) accounts: one spotlight at a time, in the order a judge should see the app.
// Steps can live on other pages; "다음" navigates there and waits for the target. Progress lives in localStorage,
// so the tour survives page loads and a switch to another country's sample account.
// ponytail: hand-rolled (a box-shadow cut-out and a positioned card) instead of a tour library; ~200 lines, no dependency.
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "./Icon";
import { setLang } from "@/app/actions";
import type { Lang } from "@/lib/i18n";
import { useT } from "./I18n";

type Step = {
  title: string;
  body: string;
  target?: string; // CSS selector; the first visible match is lit
  path?: string | (() => string | null); // where the target lives; "/posts/" means any post; null: stay
  click?: string; // "다음" follows this link inside the target instead of navigating to the next step's path
  cta?: string; // the next button's label when it does something specific ("이 글 열기")
};

const KEY = "boundless-tour";
const TALL = 0.45; // share of the screen a lit box may take
const desktop = () => window.matchMedia("(min-width: 1024px)").matches;

type Progress = { step: number; done: boolean };
// Progress as a tiny external store over localStorage. A blocked storage still works for the current page.
let memory: string | null = null;
// The post the tour opened, so 이전 from a later page can go back to it.
let lastPost: string | null = null;
const listeners = new Set<() => void>();
function raw() {
  try {
    return memory ?? localStorage.getItem(KEY);
  } catch {
    return memory;
  }
}
function save(v: Progress) {
  memory = JSON.stringify(v);
  try {
    localStorage.setItem(KEY, memory);
  } catch {}
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));
// First visit with a sample account: the tour starts.
const FIRST = JSON.stringify({ step: 0, done: false });
const NOT_YET = JSON.stringify({ step: 0, done: true });

const visible = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
};
const find = (sel?: string) => (sel ? ([...document.querySelectorAll(sel)].find(visible) as HTMLElement | undefined) : undefined);

export function DemoTour({ country, lang }: { country: string; lang: Lang }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  // One line per step: what this is. The button says what happens next.
  const steps: Step[] = [
    { title: t("한국 사는 외국인의 익명 Q&A"), body: t("생활 질문을 국적만 밝히고 묻고 답하는 곳이에요."), target: "[data-tour=hello]", path: "/feed", cta: t("둘러보기 시작") },
    { title: t("화면 언어"), body: t("여기서 16개 언어로 바꿔요."), target: ".astryx-top-nav [data-tour=lang]", path: "/feed" },
    { title: t("우리나라 라운지"), body: t("같은 국적 이웃만 들어오는 방이에요."), target: "[data-tour=lounge]", path: "/feed" },
    { title: t("모두의 광장"), body: t("모든 나라 이웃의 질문과 경험담이에요."), target: "[data-tour=square]", path: "/feed" },
    { title: t("질문 열어 보기"), body: t("카드에 지역, 국적, 해결 여부가 보여요."), target: "article:has(a[href^='/posts/'])", path: "/feed", click: "a[href^='/posts/']", cta: t("이 글 열기") },
    { title: t("원문과 번역"), body: t("모르는 언어도 버튼 하나로 번역해요."), target: "[data-tour=body]", path: "/posts/" },
    { title: t("도움돼요와 저장"), body: t("도움된 글에 고마움을 남기고 저장해요."), target: "[data-tour=actions]", path: "/posts/", cta: t("검색 보기") },
    { title: t("검색"), body: t("답이 없으면 바로 질문으로 이어져요."), target: "[data-tour=search]", path: "/search", cta: t("글쓰기 보기") },
    { title: t("글쓰기"), body: t("게시판을 고르면 작성 안내가 바뀌어요."), target: "[data-tour=boards]", path: "/write" },
    {
      title: t("나라 바꾸기"),
      body: t("다른 나라 이웃이 되면 테마와 언어가 바뀌어요."),
      target: "[data-tour=switch]",
      // Desktop has it in the sidebar on every page; phones and tablets have it in settings.
      path: () => (desktop() ? null : "/settings"),
    },
    { title: t("다 봤어요"), body: t("이제 자유롭게 둘러보세요. 운영자 화면은 첫 화면에서 열 수 있어요.") },
  ];
  const last = steps.length - 1;

  // null on the server and during hydration, so nothing renders until the browser knows the progress.
  // A first visit starts the tour only on the feed, where sample sign-in lands; a deep link just shows the button.
  const snap = useSyncExternalStore(subscribe, () => raw() ?? (pathname === "/feed" ? FIRST : NOT_YET), () => null);
  const state: Progress | null = snap ? JSON.parse(snap) : null;
  // The lit box for the current step; a box measured for another step is ignored.
  const [lit, setLit] = useState<{ step: number; rect: DOMRect } | null>(null);
  const [cardH, setCardH] = useState(220);
  const card = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const open = state && !state.done;
  const step = open ? steps[Math.min(state.step, last)] : null;


  // Light the target once it exists (pages stream in), and keep the light on it while the page scrolls or resizes.
  useLayoutEffect(() => {
    if (!open || !step?.target) return;
    const at = state.step;
    let el: HTMLElement | undefined;
    let raf = 0;
    let scrolled = false; // a variable, not a DOM attribute: the page may still be hydrating
    const started = performance.now();
    const track = () => {
      el ??= find(step.target);
      if (el) {
        if (!scrolled) {
          scrolled = true;
          const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
          const top = el.getBoundingClientRect().top;
          // A tall target (a whole list) starts just under the top bar instead of centering past the screen.
          if (el.offsetHeight > window.innerHeight * TALL) window.scrollTo({ top: window.scrollY + top - 88, behavior });
          else el.scrollIntoView({ block: "center", behavior });
        }
        const full = el.getBoundingClientRect();
        // Only the top of a tall target is lit, so the card fits under it.
        const r = full.height > window.innerHeight * TALL ? new DOMRect(full.x, full.y, full.width, window.innerHeight * TALL) : full;
        // flushSync paints the new box in this frame; a plain update lands a frame late and trails a smooth scroll.
        flushSync(() => setLit((old) => (old && old.step === at && old.rect.top === r.top && old.rect.left === r.left && old.rect.width === r.width && old.rect.height === r.height ? old : { step: at, rect: r })));
      }
      // Give up looking after 4s: the card then shows centered, without a spotlight.
      if (el || performance.now() - started < 4000) raf = requestAnimationFrame(track);
    };
    raf = requestAnimationFrame(track);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, state?.step, pathname]);

  // Focus the card on each step so screen readers and keyboards follow along; Esc closes the tour.
  useEffect(() => {
    if (!open) return;
    heading.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && save({ step: state.step, done: true });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, state?.step]);

  // The card's height decides whether it fits under the target.
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCardH(e.borderBoxSize?.[0]?.blockSize ?? e.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const rect = open && step?.target && lit?.step === state.step ? lit.rect : null;
  if (!state) return null;
  if (!open || !step)
    return (
      <button
        type="button"
        onClick={() => {
          if (pathname !== "/feed") router.push("/feed");
          save({ step: 0, done: false });
        }}
        className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--c-ink)] px-4 text-sm font-bold text-white shadow-lg ring-2 ring-white/70 transition hover:-translate-y-0.5 lg:bottom-6"
      >
        <Icon name="info" size={16} />
        {t("체험 가이드")}
      </button>
    );

  // Moving to a step goes to the page it lives on. Only 이전/다음 navigate, never a page load, so the tour does not
  // pull anyone away from where they are. Post steps arrive through the card's own link (see next).
  const go = (i: number) => {
    const to = Math.max(0, Math.min(i, last));
    const p = steps[to].path;
    const want = typeof p === "function" ? p() : p === "/posts/" ? (pathname.startsWith("/posts/") ? null : lastPost) : p;
    if (want && pathname !== want) router.push(want);
    save({ step: to, done: false });
  };
  const next = () => {
    if (state.step === last) return save({ step: 0, done: true });
    if (step.click) {
      const link = find(step.target)?.querySelector<HTMLAnchorElement>(step.click);
      if (link) router.push((lastPost = link.getAttribute("href")!));
      // No post to open (an empty feed): skip the post steps instead of bouncing back here.
      else return go(steps.findIndex((x, i) => i > state.step && x.path !== "/posts/"));
    }
    go(state.step + 1);
  };

  // Card placement: under the target if it fits, else above, else pinned to the bottom of the screen.
  const pad = 8;
  const W = Math.min(360, window.innerWidth - 32);
  let style: React.CSSProperties = { width: W, left: (window.innerWidth - W) / 2, top: window.innerHeight / 2, transform: "translateY(-50%)" };
  if (rect) {
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - W / 2), window.innerWidth - W - 16);
    const h = cardH;
    if (rect.bottom + pad + 12 + h < window.innerHeight - 16) style = { width: W, left, top: rect.bottom + pad + 12 };
    else if (rect.top - pad - 12 - h > 16) style = { width: W, left, top: rect.top - pad - 12 - h };
    else style = { width: W, left, bottom: "calc(5.5rem + env(safe-area-inset-bottom))" };
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" role="presentation">
      {/* The light: a clear box over the target, the rest of the page dimmed by its enormous shadow. Clicks pass through.
          No position transition: the box is re-measured every frame and must stay glued to the target while the page
          scrolls; easing it made the light trail far behind. The keys stop React from morphing the full-screen dim into
          the box, which slid the light down from the top of the screen on every step. */}
      {rect ? (
        <div
          key="light"
          aria-hidden="true"
          className="pointer-events-none fixed rounded-xl ring-2 ring-white/80"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: "0 0 0 9999px rgb(10 14 30 / .58)" }}
        />
      ) : (
        <div key="dim" aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[rgb(10_14_30/.58)]" />
      )}
      <div
        ref={card}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        className="pointer-events-auto fixed rounded-2xl bg-[var(--color-background-popover)] p-4 text-[var(--color-text-primary)] shadow-2xl ring-1 ring-black/10"
        style={style}
      >
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--c-primary)] px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
            {state.step + 1} / {steps.length}
          </span>
          <h2 id="tour-title" ref={heading} tabIndex={-1} className="min-w-0 flex-1 font-display text-base font-extrabold outline-none">
            {step.title}
          </h2>
          <button type="button" onClick={() => save({ step: state.step, done: true })} className="-mr-1 flex size-8 items-center justify-center rounded-full hover:bg-[var(--color-background-muted)]" aria-label={t("안내 닫기")}>
            <Icon name="plus" size={18} className="rotate-45" />
          </button>
        </div>
        <p className="mt-1.5 text-[15px] leading-snug">{step.body}</p>
        {state.step === 0 && (
          <>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{t("{country} 샘플 계정이에요. 데이터는 모두 가상이에요.", { country })}</p>
            {/* Sample accounts open in their country's language. These two stay in their own language so anyone can read them. */}
            <div className="mt-3 flex flex-wrap gap-2">
              {lang !== "ko" && (
                <form action={setLang.bind(null, "ko")}>
                  <Button type="submit" label="한국어로 보기" variant="secondary" size="sm" icon={<Icon name="globe" size={14} />} />
                </form>
              )}
              {lang !== "en" && (
                <form action={setLang.bind(null, "en")}>
                  <Button type="submit" label="View in English" variant="secondary" size="sm" />
                </form>
              )}
            </div>
          </>
        )}
        {state.step === last && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button href="/policy" label={t("운영 정책 보기")} variant="secondary" size="sm" />
            <Button href="/#demo" label={t("운영자 화면 보기")} variant="secondary" size="sm" />
          </div>
        )}
        {/* Progress as dots: where you are in the whole tour. */}
        {/* The buttons wrap below the dots when a long label (e.g. Vietnamese) needs the room, instead of truncating. */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="flex shrink-0 gap-1" aria-hidden="true">
            {steps.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full ${i === state.step ? "w-4 bg-[var(--c-primary)]" : "w-1.5 bg-[var(--color-border-emphasized)]"}`} />
            ))}
          </span>
          <span className="ml-auto flex shrink-0 gap-2">
            {state.step > 0 && <Button label={t("이전")} variant="ghost" size="sm" onClick={() => go(state.step - 1)} />}
            <Button label={state.step === last ? t("마치기") : (step.cta ?? t("다음"))} variant="primary" size="sm" onClick={next} />
          </span>
        </div>
      </div>
    </div>
  );
}
