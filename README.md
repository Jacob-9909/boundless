<div align="center">

<img src="src/app/icon.svg" alt="Boundless 로고" width="88" height="88" />

# Boundless

**한국에 사는 모든 외국인을 위한 익명 생활정보 커뮤니티**

먼저 겪은 이웃의 경험을 찾고, 국적만 밝힌 채 익명으로 묻고, 답을 보고 다음 행동을 정합니다.

[![CI/CD](https://github.com/Jacob-9909/boundless/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/Jacob-9909/boundless/actions/workflows/ci-cd.yml)
[![Backup](https://github.com/Jacob-9909/boundless/actions/workflows/backup.yml/badge.svg?branch=main)](https://github.com/Jacob-9909/boundless/actions/workflows/backup.yml)
[![Uptime](https://github.com/Jacob-9909/boundless/actions/workflows/uptime.yml/badge.svg?branch=main)](https://github.com/Jacob-9909/boundless/actions/workflows/uptime.yml)
![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel)

[**서비스 바로가기**](https://boundless-virid.vercel.app) · [기능 안내](docs/FEATURES.md) · [배포·운영 가이드](docs/DEPLOY.md) · [보안 정책](.github/SECURITY.md) · [기여 가이드](.github/CONTRIBUTING.md)

</div>

![첫 화면: 여러 나라의 노선이 한국에서 만나는 노선도](docs/screenshots/01-landing-hero.jpg)

> **바로 체험:** 첫 화면의 **샘플 계정**에서 나라를 고르면 이메일 인증 없이 그 나라 이웃으로 들어갑니다. 15개국과 그 밖의 나라(캐나다) 계정, 읽기 전용 운영자 계정이 있습니다. 샘플 계정의 글과 프로필은 모두 가상 데이터입니다.

## 목차

- [개요](#개요)
- [핵심 기능](#핵심-기능)
- [아키텍처](#아키텍처)
- [기술 스택](#기술-스택)
- [저장소 구조](#저장소-구조)
- [시작하기](#시작하기)
- [품질 관리](#품질-관리)
- [배포와 운영](#배포와-운영)
- [보안과 개인정보](#보안과-개인정보)
- [제품 결정](#제품-결정)
- [로드맵](#로드맵)
- [문서](#문서)

---

## 개요

| | |
| --- | --- |
| **문제** | 한국 생활 정보는 많지만 외국인 주민이 쓰기 어렵습니다. 안내가 한국어로만 있거나 다른 지역·체류 자격의 이야기가 섞여 있어, "내 건물, 내 비자"에 맞는지 알기 어렵고 결국 지인에게 다시 묻게 됩니다. |
| **목표** | 질문이 생긴 순간 비슷한 경험을 찾고, 필요하면 익명으로 물어서, 자기 상황에 맞는 다음 행동을 스스로 정하게 돕습니다. |
| **성공 기준** | 이용자가 관련 글이나 답변을 보고 "어디에서 무엇을 확인할지" 정할 수 있으면 성공입니다. |
| **이름과 로고** | 국경(Boundary) 없이 누구나 어우러진다는 뜻입니다. 로고는 서울 지하철 노선 색 조각을 이어 붙인 조각보 ㅂ이고, 오른쪽 위 작은 조각이 새로 온 이웃입니다. |

<details>
<summary>예시 시나리오: 이사한 동네의 재활용 배출 방법</summary>

1. 한국에 온 지 얼마 안 된 A가 화면 언어를 바꾸고, 가입하지 않은 채 **집·주거** 게시판에서 재활용 글을 검색합니다.
2. 자기 건물에 맞는 답이 없어 질문을 올립니다. 공개되는 건 국적 하나이고, 주소는 시·도까지만 고릅니다.
3. **내 글**에서 새 답변 알림을 보고 "건물마다 다르니 관리사무소에 먼저 물어보세요"라는 답을 읽습니다.
4. A는 관리사무소에 배출 장소와 시간을 확인하기로 합니다. 글 아래에는 관련 공식 기관 안내도 함께 보입니다.

</details>

## 핵심 기능

| 기능 | 내용 |
| --- | --- |
| **검색 → 질문 → 답변** | 원문과 번역문을 함께 검색합니다. 결과가 없으면 그 검색어로 바로 질문을 씁니다. 새 답변은 알림으로 오고, 해결되면 "해결됨"으로 표시합니다. |
| **화면 언어 16개** | 한국어·영어와 14개국 언어를 지원합니다. 언어를 고른 적 없는 기기에서는 국적 언어가 기본입니다. |
| **글 번역** | 글마다 원문 언어를 표시하고 버튼 하나로 내 언어로 번역합니다. 번역 결과는 DB에 캐시합니다. |
| **나라별 문화 테마** | 로그인 화면부터 16개 테마로 바뀝니다. 나라마다 하늘, 랜드마크, 상징 소품, 모국어 인사와 서체가 한 장면을 이루고, 가입하면 앱 전체가 내 문화의 색을 입습니다. |
| **게시판 12개 + 공간 2개** | 생활 정보, 한국 즐기기, 이야기 게시판과 모든 나라가 함께 보는 **모두의 광장**, 같은 국적만 들어오는 **나라별 라운지**가 있습니다. |
| **AI 보조** | 글 자동 분류(비자·지역·위기), 해결된 글의 AI 요약, 글쓰기 전 질문 점검, 위기 신호 상담 카드를 제공합니다. 키가 없으면 해당 기능만 숨겨집니다. |
| **익명과 안전** | 공개 정보는 국적 하나와 글마다 바뀌는 익명 호칭뿐입니다. 신고·차단, 운영자 검토, 작성자 재심, 개인정보 노출 경고, 요청 횟수 제한이 있습니다. |
| **공식 안내 연결** | 비자·의료·법률 글 아래에 관련 공식 기관을 보여 주고, 긴급 전화(112, 119, 1345 등)를 한곳에 모았습니다. |
| **운영 대시보드** | 회원·글·답변 추이, 해결률, 신고·AI 위기 표시, 시스템 상태, 신고·재심 처리 큐, 역할 관리, 처리 기록을 제공합니다. |

그 밖에 저장, 공유, 대댓글, 임시 저장, 장터 가격·거래 상태, 팝업 기간·장소, 웹 앱 설치, 알림함, 아바타 꾸미기, 도움왕 랭킹과 레벨, 심사용 체험 가이드를 지원합니다. 화면별 설명과 작동 방식은 [docs/FEATURES.md](docs/FEATURES.md)에 있습니다.

| 고른 나라로 바뀌는 로그인 화면 | 일본 계정: 화면 전체가 일본어 | 태국 계정, 휴대폰 |
| --- | --- | --- |
| ![베트남 테마 로그인](docs/screenshots/04-login-theme-vn.jpg) | ![일본어 홈](docs/screenshots/10-feed-japanese.jpg) | ![태국 계정 휴대폰 홈](docs/screenshots/34-mobile-feed.jpg) |

## 아키텍처

```mermaid
flowchart LR
  user["브라우저 · 설치형 웹 앱"]

  subgraph vercel["Vercel (sin1)"]
    proxy["proxy.ts<br/>요청별 CSP nonce"]
    app["Next.js 16 App Router<br/>Server Components · Server Actions"]
    cron["Vercel Cron<br/>매일 정리 작업"]
  end

  subgraph data["데이터"]
    neon[("Neon PostgreSQL<br/>schema boundless")]
    blob[("Vercel Blob<br/>비공개 사진")]
  end

  subgraph ext["외부 서비스"]
    smtp["Gmail SMTP<br/>로그인 코드"]
    nim["NVIDIA NIM<br/>분류 · 요약 · 점검"]
    mm["MyMemory<br/>글 번역"]
  end

  subgraph gha["GitHub Actions"]
    ci["CI/CD<br/>lint · 검사 · build · e2e → 배포"]
    backup["Backup<br/>매일 암호화 덤프 + 복원 검증"]
    uptime["Uptime<br/>매시 /api/health"]
  end

  user --> proxy --> app
  app --> neon
  app --> blob
  app --> smtp
  app --> nim
  app --> mm
  cron --> app
  ci -- "마이그레이션 · 배포" --> vercel
  backup --> neon
  uptime --> app
```

- **서버 중심 렌더링.** 모든 쓰기는 `src/app/actions.ts`의 Server Actions를 거칩니다. 별도 API 서버나 ORM 없이 SQL을 직접 씁니다.
- **같은 리전.** Neon이 서울·도쿄 리전을 제공하지 않아 싱가포르(`sin1`)를 쓰고, DB 왕복을 줄이려고 함수도 같은 리전에 둡니다.
- **선택 기능이 빠져도 동작.** AI 키, Blob 저장소, 알림 웹훅이 없어도 앱은 돌아갑니다. AI 기능은 숨겨지고, 사진은 Postgres에 저장되며, 오류는 로그로만 남습니다.

## 기술 스택

| 영역 | 사용 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| UI | Tailwind CSS 4, Astryx 디자인 시스템([docs/ASTRYX.md](docs/ASTRYX.md)), DiceBear 아바타 |
| 데이터 | PostgreSQL (Neon), `pg` 드라이버, 번호 붙은 SQL 마이그레이션, trigram 검색 인덱스 |
| 파일 | Vercel Blob(비공개). 없으면 Postgres에 저장 |
| 인증 | 이메일 6자리 코드 + 서명 쿠키 세션, 세션 버전으로 모든 기기 로그아웃 |
| AI | NVIDIA NIM (`nvidia/nemotron-3.5-super-vl-120b-a12b`) |
| 번역 | 화면 문구는 언어별 사전 16개(`src/features/i18n/en.ts`, `src/features/i18n/locales/*.json`), 글은 MyMemory API + DB 캐시 |
| 인프라 | Vercel (호스팅, Cron), GitHub Actions (CI/CD, 백업, 가동 확인), Dependabot |

## 저장소 구조

```text
.
├── src/
│   ├── app/                 라우트 (App Router)
│   │   ├── page.tsx         소개 첫 화면
│   │   ├── login/           문화별 로그인
│   │   ├── (app)/           로그인 뒤 화면: 피드, 게시판, 라운지, 검색, 글, 글쓰기, 설정, 운영
│   │   ├── api/             health, cron/cleanup, img
│   │   └── actions.ts       모든 쓰기 동작 (Server Actions)
│   ├── features/            기능별 모듈: 로직과 그 기능의 화면 컴포넌트를 한 폴더에
│   │   ├── auth/            세션·역할, 로그인 코드 메일, 로그인 화면
│   │   ├── posts/           글·게시판 조회, 사진, 금칙어·개인정보 검사, 피드, 글쓰기·댓글·신고 폼
│   │   ├── translation/     글 번역 (MyMemory)과 번역 버튼
│   │   ├── ai/              NVIDIA NIM 분류·요약·점검과 AI 요약 카드
│   │   ├── avatar/          아바타 부품과 꾸미기 화면
│   │   ├── culture/         나라별 문화 테마, 장면, 랜드마크
│   │   ├── i18n/            화면 언어 사전 16개와 언어 메뉴
│   │   ├── admin/           운영 대시보드 지표와 화면
│   │   ├── notifications/   알림함
│   │   └── guide/           공식 기관 안내와 심사용 체험 가이드
│   ├── components/          여러 기능이 같이 쓰는 UI: 디자인 요소, 아이콘, 입력 칸, 내비게이션
│   ├── lib/                 공용 인프라: DB 연결, TLS, 오류 로그
│   ├── themes/              Astryx 테마
│   ├── proxy.ts             CSP와 보안 헤더
│   └── instrumentation.ts   서버 오류 보고
├── db/
│   ├── migrations/          스키마 (번호 순서로 한 번씩 적용)
│   ├── seed.sql             가상 시드 데이터
│   └── community.sql        가상 이웃 45명의 7일 활동
├── scripts/                 DB 적용, 문구·금칙어·AI·아바타 검사, 데이터 이전
├── e2e/                     전체 흐름 테스트
├── infra/                   Vercel 밖 리눅스 VM 배포용 systemd 유닛과 배포 스크립트
├── docs/                    기능 안내, 배포·운영 가이드, 디자인 시스템, 브랜드, 스크린샷
├── public/                  국기 이미지, robots.txt
└── .github/                 워크플로, Dependabot, PR 템플릿, 보안 정책, 기여 가이드
```

루트에 남은 파일은 도구가 루트에 있어야 읽는 설정입니다: `package.json`·`package-lock.json`(npm), `next.config.ts`·`AGENTS.md`(Next.js), `tsconfig.json`, `eslint.config.mjs`, `vercel.json`, `.env.example`, `.gitignore`.

## 시작하기

**요구 사항:** Node.js 24, PostgreSQL 17 이상(또는 PGlite)

```bash
npm install
cp .env.example .env.local        # DATABASE_URL, SESSION_SECRET 채우기
npm run db                        # 마이그레이션 + 가상 시드 데이터 (example.com 계정)
npm run dev
```

로컬 Postgres가 없으면 PGlite를 씁니다.

```bash
npx -p @electric-sql/pglite-socket pglite-server --db=./.pgdata --port=5439 -m 10
# DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5439/postgres
```

`EMAIL_SENDER`가 비어 있으면 개발 모드에서 로그인 코드를 메일 대신 화면과 콘솔에 보여 줍니다. 환경 변수 전체 목록은 [.env.example](.env.example)과 [docs/DEPLOY.md](docs/DEPLOY.md#vercel-환경변수)에 있습니다.

## 품질 관리

모든 PR과 `main` 푸시에서 GitHub Actions가 아래를 순서대로 실행합니다. 하나라도 실패하면 배포하지 않습니다.

| 단계 | 명령 | 확인하는 것 |
| --- | --- | --- |
| Lint | `npm run lint` | ESLint (Next.js 규칙) |
| 화면 문구 | `npm run i18n` | 모든 문구에 영어가 있는지, 언어별로 빠진 줄이 없는지 |
| 금칙어 필터 | `node scripts/moderation-check.mjs` | 다국어 욕설은 걸러지고 정상 단어는 통과하는지 |
| AI 안전장치 | `node scripts/ai-check.mjs` | AI가 무엇을 답하든 개인정보 제거, 응답 파싱, 위기 폴백이 유지되는지 |
| 아바타 | `node scripts/avatar-check.mjs` | 허용된 부품만 저장되고 모든 부품이 렌더링되는지 |
| 빌드 | `npm run build` | 타입 검사와 프로덕션 빌드 |
| E2E | `npm run e2e` | 실제 Postgres 위에서 가입부터 탈퇴까지 전체 흐름 |

E2E는 가입, 글쓰기, 익명 호칭, 도움돼요·저장·대댓글, 새 답변 알림, 해결·수정, 검색, 신고, 차단, 운영자 가리기, 재심 요청과 복구, 처리 기록, 역할 주고 빼기, 탈퇴, 샘플 계정의 언어 전환, 라운지 접근 제한, 모든 기기 로그아웃을 확인합니다.

## 배포와 운영

| 항목 | 구성 |
| --- | --- |
| 배포 | `main` 푸시 → CI 통과 → 밀린 마이그레이션 적용 → `vercel build --prod` → `vercel deploy --prebuilt --prod` → `/api/health` 확인 |
| 롤백 | 코드는 Vercel에서 이전 배포를 Promote. 스키마는 expand/contract 원칙으로 앞으로만 진행 |
| 백업 | 1차 Neon 시점 복구(PITR), 2차 매일 `pg_dump` AES-256 암호화 + 임시 DB 복원 검증, 7일 보관. 목표 RPO 24시간, RTO 1시간 |
| 모니터링 | 서버 오류 JSON 로그(Vercel Logs), 선택적 웹훅 알림, 매시 가동 확인 |
| 정리 작업 | Vercel Cron이 매일 만료 코드·오래된 요청 기록·삭제된 사진 파일 정리 |
| 의존성 | Dependabot이 npm과 GitHub Actions 업데이트를 묶어서 PR로 올림 |

환경 변수, 마이그레이션 규칙, 복구 절차, 다른 서버로 옮기는 방법, 출시 전 체크리스트는 [docs/DEPLOY.md](docs/DEPLOY.md)에 있습니다.

## 보안과 개인정보

- **CSP:** 요청마다 새 nonce를 쓰는 `script-src 'strict-dynamic'`, `frame-ancestors 'none'`, `form-action 'self'` 등 보안 헤더를 적용합니다.
- **세션:** 서명된 쿠키 세션이며, 세션 버전을 올려 서버에서 모든 기기의 세션을 끊을 수 있습니다.
- **남용 방지:** 로그인 코드는 이메일당 60초에 한 번·하루 10번, 네트워크(IP 해시)당 1시간에 20번으로 제한하고, 글·댓글에도 횟수 제한이 있습니다.
- **익명성:** 다른 사람에게 보이는 정보는 국적과 글마다 바뀌는 호칭뿐이고, 이메일은 비공개입니다. 글쓰기에서 전화번호·계좌 같은 개인정보를 감지해 경고합니다.
- **권한:** 운영자·관리자 역할을 분리하고, 모든 운영 결정을 처리 기록에 남깁니다. 샘플 계정은 어떤 권한도 받지 못합니다.
- **개인정보 처리:** 보관 기간과 국외 처리(업체·국가·항목·기간)를 운영 정책(`/policy`)에 고지합니다. 탈퇴하면 계정과 작성물을 바로 지웁니다.

취약점은 공개 이슈 대신 [.github/SECURITY.md](.github/SECURITY.md)의 절차로 알려 주세요.

## 제품 결정

| 항목 | 현재 결정 |
| --- | --- |
| 가입 연령 | 만 14세 이상. 가입할 때 확인합니다. |
| 국적 정정 | 설정에서 직접 바꾸고, 바꾼 뒤 30일 동안은 다시 바꿀 수 없습니다. |
| 신고·재심 | 운영자가 "가리기" 또는 "문제 없음"으로 처리합니다. 가려진 글의 작성자는 한 번 재심을 요청할 수 있습니다. |
| 탈퇴 후 데이터 | 계정, 글, 댓글, 신고·재심 기록, 번역 캐시를 바로 지웁니다. 이용 지표는 누구인지 알 수 없는 형태로만 남습니다. |
| 쪽지·채팅 | 넣지 않습니다. 익명 공간에서는 사기와 괴롭힘 위험이 큽니다. 장터 거래도 댓글로만 대화합니다. |
| 문화 테마 | 조사를 거쳐 종교·정치 상징을 배제했습니다. 예: 캄보디아는 파랑·흰색 크로마만, 인도는 연꽃 대신 페이즐리, 일본은 욱일 문양 배제. |
| 접근성 | axe-core로 전 페이지를 점검했습니다. 16개 테마 모두 본문 대비 4.5:1 이상이고, 키보드 이동과 움직임 줄이기 설정을 지원합니다. |

<details>
<summary>나라별 테마 목록</summary>

| 나라 | 인사말 서체 | 모티프 |
| --- | --- | --- |
| 중국 | Ma Shan Zheng (붓글씨) | 회문(回纹) 창살 · 주홍과 금빛 |
| 베트남 | Be Vietnam Pro | 연꽃 · 옻칠(sơn mài) 붉은색 |
| 태국 | Chonburi | 쁘라짬얌 네 잎 무늬 · 타이 실크의 보라와 금 |
| 미국 | Overpass (고속도로 표지판) | 별과 줄무늬 |
| 우즈베키스탄 | Philosopher | 마르길란 아드라스 이캇 · 레기스탄 |
| 몽골 | Rubik | 울지(Ölzii) 매듭 · 초원의 하늘색 |
| 필리핀 | Bungee (지프니 간판) | 여덟 줄기 태양과 세 별 |
| 네팔 | Yatra One | 다카(Dhaka) 직물 · 크림슨과 감청 |
| 인도네시아 | Fraunces | 바틱 카웅 · 소간 갈색 |
| 일본 | Shippori Mincho | 세이가이하 물결 · 쪽빛과 주홍 |
| 캄보디아 | Moul | 파랑·흰색 크로마 체크 · 앙코르와트 |
| 카자흐스탄 | Rubik | 코쉬카르 무이즈(숫양 뿔) · 하늘색과 태양 금빛 |
| 러시아 | Ruslan Display | 그젤(Gzhel) 도자기의 코발트 꽃 |
| 프랑스 | Playfair Display | 비스트로 차양 줄무늬 |
| 인도 | Rozha One | 페이즐리(부타) · 공작빛 · 타지마할 |
| 그 밖의 나라 | Bricolage Grotesque | 국경 없이 이어지는 노선도 (기본 테마) |

</details>

<details>
<summary>3분 체험 순서 (심사용)</summary>

샘플 계정으로 들어오면 **체험 가이드**가 아래 순서를 화면에서 하나씩 짚어 줍니다. 닫은 뒤에는 오른쪽 아래 **체험 가이드** 버튼으로 다시 볼 수 있습니다.

1. **첫 화면**에서 서비스 소개와 노선도를 봅니다.
2. **샘플 계정 → 베트남**을 누릅니다. 화면 전체가 베트남어와 베트남 테마로 바뀝니다. 오른쪽 위 언어 메뉴에서 한국어로 바꿀 수 있습니다.
3. **홈**에서 게시판, 베트남 라운지(같은 국적만 입장), 모두의 광장을 봅니다.
4. **글을 하나 엽니다.** 원문 언어 표시와 번역 버튼, 도움돼요·저장·공유, 아래쪽 공식 안내를 확인합니다.
5. **검색**에서 아무 단어나 찾아봅니다. 결과가 없으면 바로 질문으로 이어집니다.
6. **글쓰기**에서 게시판을 고르면 말머리와 작성 안내가 바뀝니다. 장터는 가격과 장소 칸이 나옵니다.
7. 사이드바(휴대폰은 설정 화면)의 **다른 나라 이웃으로 바꾸기**로 다른 나라를 고르면 테마와 언어가 바로 바뀝니다.
8. 첫 화면의 **운영자 화면 보기**에서 운영 대시보드와 신고·재심 처리 큐를 봅니다(읽기 전용).
9. **운영 정책**(`/policy`)에서 공개 정보, 신고·재심, 탈퇴 후 데이터 처리를 확인합니다.

로그인한 상태에서 `/`를 열면 피드로 바로 갑니다. 소개 화면은 사이드바 맨 아래 "Boundless 소개"(휴대폰은 설정 화면) 또는 `/?intro=1`에서 다시 볼 수 있습니다.

</details>

## 로드맵

- [x] 실제 이메일 로그인 (Gmail SMTP) 운영 적용
- [x] 운영자 계정, 개인정보 문의처 설정
- [x] 매일 암호화 백업과 복원 검증, 매시 가동 확인
- [ ] 서버 오류·가동 실패 알림 웹훅(`ALERT_WEBHOOK_URL`) 연결
- [ ] Neon PITR 보관 기간을 운영 정책의 "최대 7일"과 맞춰 확인
- [ ] 화면 문구 14개 언어와 문화별 인사말의 원어민 검수 (현재 AI 번역)
- [ ] 글 번역 한도 확대 (`MYMEMORY_EMAIL` 설정 또는 유료 번역 API)
- [ ] 운영 정책 법률 검토, 이용약관 별도 페이지, 개인정보 보호책임자 지정
- [ ] 실제 이용자 대상 사용성 검증

## 문서

| 문서 | 내용 |
| --- | --- |
| [docs/FEATURES.md](docs/FEATURES.md) | 화면별 기능 안내와 작동 방식, AI 작동 구조 |
| [docs/DEPLOY.md](docs/DEPLOY.md) | 현재 인프라, 환경 변수, 마이그레이션, 백업·복구, 서버 이전, 출시 전 체크리스트 |
| [docs/ASTRYX.md](docs/ASTRYX.md) | Astryx 디자인 시스템 연결 방식과 규칙 |
| [docs/brand/logo-concepts.html](docs/brand/logo-concepts.html) | 로고 콘셉트, 배경·문화·크기별 시안 |
| [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) | 브랜치·커밋 규칙, PR 절차, 로컬 검사 |
| [.github/SECURITY.md](.github/SECURITY.md) | 취약점 제보 절차 |
