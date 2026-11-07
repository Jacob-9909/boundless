import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { demoLogin, setLang } from "@/app/actions";
import { cultureFonts } from "@/app/login/fonts";
import { HelloRotator } from "@/components/HelloRotator";
import { Icon, type IconName } from "@/components/Icon";
import { Avatar, Flag, LINES, Logo, NationalityChip, TopicBadge } from "@/components/ui";
import { demoEnabled, getT, getUser } from "@/lib/auth";
import { CULTURES, DEFAULT_CULTURE, themeVars } from "@/lib/cultures";
import { HOTLINES, SITES } from "@/lib/guide";
import { countryName, timeAgo } from "@/lib/i18n";
import { communityStats, listPosts, recentActivity } from "@/lib/posts";

export const metadata = { title: { absolute: "Boundless · 국경 없이, 한국 생활을 함께" } };

// Hero route map: colored lines from many countries run through one hub (Korea). viewBox 640x560.
const ROUTES = [
  { d: "M-20 120 H170 L330 280 H660", color: LINES[0] },
  { d: "M-20 300 H660", color: LINES[1] },
  { d: "M-20 470 H160 L340 290 L500 130 H660", color: LINES[2] },
  { d: "M200 -20 V140 L350 290 V580", color: LINES[3] },
  { d: "M520 -20 V90 L320 290 L170 440 V580", color: LINES[4] },
  { d: "M660 420 H480 L350 290 L230 170 H-20", color: LINES[5] },
];
const STATIONS: [string, number, number, string][] = [
  ["VN", 92, 120, LINES[0]],
  ["PH", 70, 300, LINES[1]],
  ["NP", 96, 470, LINES[2]],
  ["CN", 200, 74, LINES[3]],
  ["UZ", 520, 44, LINES[4]],
  ["TH", 590, 420, LINES[5]],
  ["US", 590, 130, LINES[2]],
  ["JP", 470, 300, LINES[1]],
  ["MN", 350, 520, LINES[3]],
  ["ID", 170, 520, LINES[4]],
  ["FR", 64, 170, LINES[5]],
  ["KZ", 600, 280, LINES[0]],
];

export default async function Landing(props: PageProps<"/">) {
  const sp = await props.searchParams;
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  // Members go straight to their feed; the logo's "?intro=1" link brings them back here.
  if (user && !sp.intro) redirect("/feed");
  const [stats, latest, activity] = await Promise.all([communityStats(), listPosts(null, { limit: 3 }), recentActivity(null, 2)]);
  const demo = demoEnabled();
  const hellos = [DEFAULT_CULTURE, ...CULTURES].map((c) => ({ code: c.code, hello: c.hello, font: c.font, color: c.c.accent }));
  const other = lang === "ko" ? "en" : "ko";
  const q = latest.find((p) => p.kind === "question") ?? latest[0];
  const a = activity[0];

  const steps: { icon: IconName; title: string; body: string; color: string }[] = [
    { icon: "search", title: t("찾아보기"), body: t("비슷한 상황을 먼저 겪은 이웃의 글을 주제·지역·국적별로 찾아요."), color: LINES[3] },
    { icon: "comment", title: t("물어보기"), body: t("공개되는 건 국적 하나와 글마다 바뀌는 익명 호칭뿐. 이메일은 보이지 않아요."), color: LINES[1] },
    { icon: "check", title: t("확인하고 행동하기"), body: t("답변과 공식 안내를 보고 다음 행동을 정해요. 새 답변은 알림으로 알려 드려요."), color: LINES[2] },
  ];
  const safety: { icon: IconName; title: string; body: string }[] = [
    { icon: "lock", title: t("국적만 공개"), body: t("이메일은 로그인에만 써요. 글마다 다른 익명 호칭이 붙어요.") },
    { icon: "flag", title: t("신고 · 차단 · 운영자 검토"), body: t("개인정보 노출, 혐오, 사기 글은 신고하면 운영자가 확인해요.") },
    { icon: "alert", title: t("도배 방지"), body: t("글·댓글·로그인 코드에 시간당 횟수 제한이 있어요.") },
    { icon: "phone", title: t("공식 정보와 함께"), body: t("비자·의료·법률 문제는 글 아래에 관련 공식 기관 안내를 보여 줘요.") },
  ];

  return (
    <div className={`${cultureFonts} bg-[#F6F5F1] text-[#14161C]`} style={themeVars(DEFAULT_CULTURE) as CSSProperties}>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-[#0B1224] text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_75%_40%,rgba(79,163,224,.25),transparent),radial-gradient(40%_40%_at_10%_90%,rgba(230,24,108,.18),transparent)]"
          aria-hidden="true"
        />
        <nav className="relative mx-auto flex max-w-7xl items-center gap-6 px-5 py-5 md:px-8">
          <Link href="/" className="text-white" aria-label="Boundless">
            <Logo />
          </Link>
          <div className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a href="#how" className="hover:text-white">
              {t("이용 방법")}
            </a>
            <a href="#cultures" className="hover:text-white">
              {t("문화 테마")}
            </a>
            {demo && (
              <a href="#demo" className="hover:text-white">
                {t("샘플 계정")}
              </a>
            )}
            <Link href="/guide" className="hover:text-white">
              {t("공식 안내")}
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <form action={setLang.bind(null, other)}>
              <button
                className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-[13px] font-bold text-white/80 ring-1 ring-white/20 hover:bg-white/10"
                aria-label={t("화면 언어 바꾸기")}
              >
                <Icon name="globe" size={16} />
                {lang.toUpperCase()}
              </button>
            </form>
            {user ? (
              <Link href="/feed" className="inline-flex h-9 items-center rounded-full bg-white px-4 text-[13px] font-bold text-[#0B1224]">
                {t("피드로 가기")}
              </Link>
            ) : (
              <Link href="/login" className="inline-flex h-9 items-center rounded-full px-4 text-[13px] font-bold ring-1 ring-white/30 hover:bg-white/10">
                {t("로그인")}
              </Link>
            )}
          </div>
        </nav>

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pt-6 pb-16 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-10 lg:pb-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 ring-1 ring-white/15 backdrop-blur">
              <span className="flex -space-x-1">
                {["VN", "NP", "UZ", "PH"].map((c) => (
                  <Flag key={c} code={c} h={14} round className="ring-2 ring-[#0B1224]" />
                ))}
              </span>
              {t("한국에 사는 모든 이웃의 익명 생활정보 커뮤니티")}
            </p>
            <h1 className="mt-6 font-display text-[44px] leading-[1.08] font-extrabold tracking-tight md:text-6xl lg:text-[68px]">
              <HelloRotator items={hellos} label={t("안녕하세요")} />
              <span className="text-white/90">,</span>
              <br />
              {t("한국 생활,")}
              <br />
              <span className="bg-gradient-to-r from-[#7DD3FC] via-[#86EFAC] to-[#FDBA74] bg-clip-text text-transparent">{t("국경 없이 함께 풀어요.")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
              {t("분리수거 요일, 교통카드 충전, 외국인등록증 연장까지. 먼저 겪은 이웃의 경험을 찾고, 국적만 밝힌 채 익명으로 묻고, 답을 확인하세요.")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-[15px] font-bold text-[#0B1224] transition hover:bg-white/90"
              >
                {t("피드 둘러보기")}
                <Icon name="next" size={18} />
              </Link>
              {demo && (
                <a
                  href="#demo"
                  className="inline-flex h-12 items-center gap-2 rounded-xl px-6 text-[15px] font-bold ring-1 ring-white/30 transition hover:bg-white/10"
                >
                  <Icon name="users" size={18} />
                  {t("샘플 계정으로 체험하기")}
                </a>
              )}
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                [stats.countries, t("개국 이웃")],
                [stats.posts, t("개의 글")],
                [stats.answers, t("개의 답변")],
              ].map(([n, label]) => (
                <div key={label} className="border-l-2 border-white/15 pl-3">
                  <dt className="sr-only">{label}</dt>
                  <dd className="font-display text-3xl font-extrabold">{n}</dd>
                  <dd className="text-xs text-white/60">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Route map + live cards */}
          <div className="relative mx-auto w-full max-w-[600px]">
            <svg viewBox="0 0 640 560" className="w-full" role="img" aria-label={t("여러 나라에서 출발한 노선이 한국에서 만나는 지도")}>
              <defs>
                <clipPath id="flagclip" clipPathUnits="objectBoundingBox">
                  <rect width="1" height="1" rx=".14" ry=".2" />
                </clipPath>
              </defs>
              {ROUTES.map((r, i) => (
                <path
                  key={i}
                  d={r.d}
                  pathLength={1}
                  fill="none"
                  stroke={r.color}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="route-draw"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
              {ROUTES.map((r, i) => (
                <circle key={`t${i}`} r="5" fill="#fff" className="train" opacity=".9">
                  <animateMotion dur={`${7 + i}s`} repeatCount="indefinite" path={r.d} />
                </circle>
              ))}
              {STATIONS.map(([code, x, y, color]) => (
                <g key={code} transform={`translate(${x - 19} ${y - 14})`}>
                  <rect width="38" height="28" rx="7" fill="#fff" stroke={color} strokeWidth="3" />
                  <image href={`/flags/${code}.svg`} x="5" y="5" width="28" height="18" preserveAspectRatio="xMidYMid slice" clipPath="url(#flagclip)" />
                </g>
              ))}
              <g transform="translate(340 290)">
                <circle r="54" fill="#0B1224" stroke="#fff" strokeWidth="5" />
                <circle r="44" fill="#fff" />
                <image href="/flags/KR.svg" x="-21" y="-28" width="42" height="28" preserveAspectRatio="xMidYMid slice" clipPath="url(#flagclip)" />
                <text y="20" textAnchor="middle" className="fill-[#0B1224] text-[13px] font-extrabold">
                  {t("한국")}
                </text>
              </g>
            </svg>

            {q && (
              <Link
                href={`/posts/${q.id}`}
                className="animate-fade-in absolute -bottom-4 left-0 w-[260px] rounded-2xl bg-white p-3.5 text-[#14161C] shadow-2xl shadow-black/40 ring-1 ring-black/5 transition hover:-translate-y-1 md:-left-6"
                style={{ animationDelay: ".8s" }}
              >
                <span className="flex items-center gap-2 text-xs">
                  <Avatar code={q.nationality} size={26} />
                  <span className="font-bold">{t("방금 올라온 질문")}</span>
                  <span className="ml-auto opacity-50">{timeAgo(q.created_at, lang)}</span>
                </span>
                <span className="mt-2 line-clamp-2 block text-[13px] leading-snug font-bold">{q.title}</span>
                <span className="mt-2 block">
                  <TopicBadge id={q.topic} t={t} />
                </span>
              </Link>
            )}
            {a && (
              <Link
                href={`/posts/${a.post_id}`}
                className="animate-fade-in absolute top-4 right-0 hidden w-[240px] rounded-2xl bg-white p-3.5 text-[#14161C] shadow-2xl shadow-black/40 ring-1 ring-black/5 transition hover:-translate-y-1 sm:block md:-right-4"
                style={{ animationDelay: "1.1s" }}
              >
                <span className="flex items-center gap-2 text-xs">
                  <Avatar code={a.nationality} size={26} />
                  <span className="font-bold">{t("{country} 이웃이 답했어요", { country: countryName(a.nationality, lang) })}</span>
                </span>
                <span className="mt-2 line-clamp-3 block text-[13px] leading-snug opacity-80">“{a.body}”</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-6 px-5 py-20 md:px-8">
        <p className="station-label text-[#0052A4]">{t("이용 방법")}</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-[40px]">{t("궁금한 게 생긴 순간, 세 정거장이면 충분해요")}</h2>
        <ol className="relative mt-10 grid gap-5 md:grid-cols-3">
          <span
            className="absolute top-7 right-[16%] left-[16%] hidden h-1 rounded-full bg-gradient-to-r from-[#00A5DE] via-[#00A84D] to-[#EF7C1C] md:block"
            aria-hidden="true"
          />
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,.05)] ring-1 ring-black/5">
              <span
                className="relative flex size-14 items-center justify-center rounded-full bg-white text-white ring-4 ring-[#F6F5F1]"
                style={{ background: s.color }}
              >
                <Icon name={s.icon} size={24} />
                <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-[#14161C] text-xs font-extrabold">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-5 text-xl font-extrabold">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-black/65">{s.body}</p>
              <div className="mt-5 rounded-2xl bg-[#F6F5F1] p-3">
                {i === 0 && (
                  <span className="flex h-10 items-center gap-2 rounded-full bg-white px-3 text-sm ring-1 ring-black/10">
                    <Icon name="search" size={16} className="opacity-50" />
                    <span className="font-semibold">{t("분리수거 요일")}</span>
                    <span className="ml-auto text-xs opacity-50">{t("서울")}</span>
                  </span>
                )}
                {i === 1 && (
                  <span className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-bold">{t("글쓴이")}</span>
                    <NationalityChip code="VN" lang={lang} />
                    <span className="inline-flex items-center gap-1 text-xs opacity-60">
                      <Icon name="lock" size={13} />
                      {t("이메일 비공개")}
                    </span>
                  </span>
                )}
                {i === 2 && (
                  <span className="flex items-start gap-2 text-[13px]">
                    <Avatar code="UZ" size={26} />
                    <span>
                      <span className="font-bold">{t("이웃 1")}</span> · {t("관리사무소에 먼저 물어보세요.")}
                      <span className="mt-1 flex items-center gap-1 text-xs text-[#0052A4]">
                        <Icon name="helpful" size={13} filled /> {t("도움돼요")} 3
                      </span>
                    </span>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Culture themes ---------- */}
      <section id="cultures" className="scroll-mt-6 bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="station-label text-[#00A84D]">{t("문화 테마")}</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-[40px]">{t("들어오는 순간, 당신의 문화로")}</h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-black/65">
                {t("로그인 화면이 고른 나라의 색과 전통 문양, 모국어 인사로 바뀌어요. 가입하면 앱 곳곳이 내 문화의 색으로 물들어요.")}
              </p>
            </div>
            <Link href="/login" className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#14161C] px-5 text-[15px] font-bold text-white">
              {t("로그인 화면에서 보기")}
              <Icon name="next" size={16} />
            </Link>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CULTURES.map((c) => (
              <li key={c.code}>
                <Link
                  href={`/login?culture=${c.code}`}
                  style={themeVars(c) as CSSProperties}
                  className="group relative flex h-40 flex-col justify-end overflow-hidden rounded-2xl bg-primary p-3.5 text-white transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <span className="bg-pattern absolute inset-0 opacity-40 transition group-hover:opacity-60" aria-hidden="true" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" aria-hidden="true" />
                  <span className="relative font-culture text-2xl leading-tight">{c.hello}</span>
                  <span className="relative mt-1 flex items-center gap-1.5 text-xs font-semibold opacity-90">
                    <Flag code={c.code} h={11} />
                    {c.native}
                  </span>
                  <span className="relative mt-0.5 line-clamp-1 text-[11px] opacity-70">{c.motif[lang]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Sample accounts for judges ---------- */}
      {demo && (
        <section id="demo" className="mx-auto max-w-7xl scroll-mt-6 px-5 py-20 md:px-8">
          <p className="station-label text-[#EF7C1C]">{t("샘플 계정")}</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-[40px]">{t("심사위원 · 체험용 샘플 계정")}</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-black/65">
            {t("나라를 고르면 그 나라 이웃의 샘플 계정으로 바로 들어가요. 이메일 인증 없이 화면을 둘러볼 수 있어요. 모든 데이터는 가상이에요.")}
          </p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[...CULTURES, DEFAULT_CULTURE].map((c) => {
              const code = c.code === "XX" ? "CA" : c.code;
              return (
                <li key={c.code}>
                  <form action={demoLogin.bind(null, c.code)}>
                    <button
                      style={themeVars(c) as CSSProperties}
                      className="group flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-black/[.07] transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/40"
                    >
                      <Avatar code={code} size={48} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-extrabold">{countryName(code, lang)}</span>
                        <span className="block truncate text-xs opacity-60">
                          {c.code === "XX" ? t("그 밖의 나라 · 기본 테마") : `${c.native} · ${c.hello}`}
                        </span>
                      </span>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition group-hover:scale-110">
                        <Icon name="next" size={18} />
                      </span>
                    </button>
                  </form>
                </li>
              );
            })}
            <li className="sm:col-span-2 lg:col-span-4">
              <form action={demoLogin.bind(null, "MOD")}>
                <button className="flex w-full items-center gap-4 rounded-2xl bg-[#14161C] p-4 text-left text-white transition hover:-translate-y-0.5 hover:shadow-lg">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Icon name="flag" size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-extrabold">{t("운영자 화면 보기 (읽기 전용)")}</span>
                    <span className="block text-xs text-white/60">
                      {t("신고 처리 큐와 최근 7일 이용 지표를 확인해요. 시연 계정이라 처리 버튼은 꺼져 있어요.")}
                    </span>
                  </span>
                  <Icon name="next" size={20} />
                </button>
              </form>
            </li>
          </ul>
        </section>
      )}

      {/* ---------- Safety + official help ---------- */}
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-2">
          <div>
            <p className="station-label text-[#996CAC]">{t("안전")}</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-[40px]">{t("익명이지만, 안전하게")}</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {safety.map((s) => (
                <li key={s.title} className="rounded-2xl bg-[#F6F5F1] p-5">
                  <Icon name={s.icon} size={22} className="text-[#996CAC]" />
                  <p className="mt-3 font-extrabold">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-black/65">{s.body}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="station-label text-[#E6186C]">{t("공식 안내")}</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-[40px]">{t("경험담과 공식 정보를 함께")}</h2>
            <ul className="mt-8 grid grid-cols-2 gap-3">
              {HOTLINES.slice(2, 6).map((h) => (
                <li key={h.tel} className="rounded-2xl bg-[#0B1224] p-4 text-white">
                  <span className="flex items-center gap-1.5 font-display text-2xl font-extrabold">
                    <Icon name="phone" size={18} />
                    {h.tel}
                  </span>
                  <span className="mt-1 block text-sm font-bold">{h.name[lang]}</span>
                  <span className="block text-xs leading-relaxed text-white/60">{t(h.desc)}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SITES.slice(0, 6).map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#F6F5F1] px-3.5 text-[13px] font-bold hover:bg-black/5"
                  >
                    {s.name[lang]}
                    <Icon name="external" size={13} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="relative overflow-hidden bg-[#0B1224] pt-20 pb-28 text-white">
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 opacity-60" aria-hidden="true">
          {LINES.slice(0, 5).map((c) => (
            <span key={c} className="h-2 w-full" style={{ background: c }} />
          ))}
        </div>
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">{t("오늘도 누군가 같은 고민을 하고 있어요")}</h2>
          <p className="mt-4 text-white/75">{t("먼저 둘러보고, 준비되면 질문하세요.")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/feed" className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-[15px] font-bold text-[#0B1224]">
              {t("피드 둘러보기")}
              <Icon name="next" size={18} />
            </Link>
            <Link href="/login" className="inline-flex h-12 items-center rounded-xl px-6 text-[15px] font-bold ring-1 ring-white/30 hover:bg-white/10">
              {t("이메일로 시작하기")}
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-5 py-10 text-sm text-black/55 md:px-8">
        <Logo className="text-[#14161C]" size={24} />
        <span>{t("국경 없이 어우러지는 한국 생활 커뮤니티")}</span>
        <span className="ml-auto text-xs">{t("시연 버전 · 모든 글과 계정은 가상 데이터예요.")}</span>
      </footer>
    </div>
  );
}
