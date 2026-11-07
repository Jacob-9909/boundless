# Boundless

국경(Boundary) 없이 누구나 어우러지는 한국 생활 커뮤니티. 한국에 살거나 머무는 외국인이 생활 정보를 찾고, 익명으로 묻고, 경험을 나눈다.
기획 기준: 「한국생활, 여기」 11월 4일 중간 점검 (유저 시나리오 · WBS · 프로토타입 캡처).

핵심 흐름: **생활정보 검색 → 질문 작성 → 내 글에서 답변 확인**

첫 화면(`/`)은 프로젝트 소개 랜딩이다. 15개국 + 기타 샘플 계정과 읽기 전용 운영자 계정으로 한 번에 들어갈 수 있어서 심사위원이 바로 확인할 수 있다(`DEMO_LOGIN=1` 또는 개발 모드). 피드는 `/feed`.

커뮤니티 구조 (에브리타임 · 당근 동네생활 참고, 편의 정보만이 아니라 한국 생활 그 자체로):

- **게시판 12개**, 게시판마다 말머리: 생활 정보(교통 · 비자·행정 · 집·주거 · 병원·건강 · 일자리·알바) / 한국 즐기기(맛집·음식 · 팝업·이벤트 · 여행·나들이 · 한국어) / 이야기(노가리 · 연애·관계 · 장터). 장터는 가격과 거래 상태(판매중·예약중·거래완료, 나눔), 팝업은 기간과 장소
- **공간 2개**: 모든 외국인이 함께 보는 *모두의 광장*과, 같은 국적만 들어오는 *우리나라 라운지*(`/lounge`)
- **화면 언어 16개**: 한국어·영어와 문화 테마 14개국 언어. 가입하면 국적 언어가 기본이고, 언어 메뉴에서 바꾸면 `lang` 쿠키로 기억한다. 14개 언어는 기계 번역(`src/lib/locales/*.json`)이라 원어민 검수 전이다
- **번역**: 글·댓글마다 내 언어로 번역 버튼(화면 언어 기준, 설정에서 변경). MyMemory 무료 API + DB 캐시
- **랭킹과 레벨**: 글 1점 · 다른 이웃 글 답변 2점 · 도움돼요 받으면 3점. 새싹 이웃 → 반가운 이웃 → 든든한 이웃 → 동네 반장 → 명예 주민. 오른쪽 패널에 도움왕 랭킹과 내 레벨
- 익명 호칭(글쓴이 / 이웃 1, 2…), 도움돼요, 저장, 대댓글, 해결됨, 새 답변 알림, 글 수정·삭제
- 신고 · 차단 · 탈퇴 · 운영 큐(`/admin`), 글/댓글/로그인 코드 횟수 제한, 공식 안내(`/guide`)

쪽지 · 채팅은 넣지 않았다(익명 커뮤니티에서 사기·괴롭힘 위험, 운영 정책 미정). 장터 거래는 댓글로만 대화하고 계좌·연락처를 쓰지 않도록 안내한다.

## 문화별 테마

로그인 화면에서 "어디에서 오셨나요?"를 고르면 화면 전체가 그 문화로 바뀐다. 나라마다 색, 전통 문양, 모국어 인사·서체에 더해 상징 풍경 실루엣(`src/lib/landmarks.ts`)이 있다. 브라우저 언어(`Accept-Language`)로 첫 화면을 추측하고, 마지막 선택은 `culture` 쿠키에 남긴다. 가입 후에는 회원의 공개 국적 테마가 앱 헤더와 버튼 색에 입혀지고, 피드의 모든 국적 칩은 작성자 문화의 색으로 표시된다.

| 코드 | 인사말 서체 | 모티프 |
| --- | --- | --- |
| CN | Ma Shan Zheng (붓글씨) | 회문 창살 · 주홍과 금 |
| VN | Be Vietnam Pro | 연꽃 · 옻칠 붉은색 |
| TH | Chonburi | 쁘라짬얌 네 잎 · 타이 실크 보라와 금 |
| US | Overpass (고속도로 표지판) | 별과 줄무늬 |
| UZ | Philosopher | 레기스탄 팔각별 · 청록과 코발트 |
| MN | Rubik | 울지 매듭 · 초원 하늘색 |
| PH | Bungee (지프니 간판) | 여덟 줄기 태양과 세 별 |
| NP | Yatra One | 다카(Dhaka) 직물 · 크림슨과 감청 |
| ID | Fraunces | 바틱 카웅 · 소간 갈색 |
| JP | Shippori Mincho | 세이가이하 물결 · 쪽빛 |
| KH | Moul | 앙코르 연꽃봉오리 탑 · 사암색 |
| KZ | Rubik | 숫양 뿔 문양 · 하늘색과 금 |
| RU | Ruslan Display | 그젤(Gzhel) 도자기 코발트 꽃 |
| FR | Playfair Display | 비스트로 차양 줄무늬 |
| IN | Rozha One | 랑골리 꽃잎 · 사프란 |
| 그 외 | Bricolage Grotesque | 국경 없는 노선도 (기본 테마) |

테마 추가: `src/lib/cultures.ts`의 `CULTURES`에 항목 하나 + `src/lib/landmarks.ts`에 실루엣 하나 + `src/app/login/fonts.ts`에 서체 하나.

조사로 정한 것: 캄보디아 크로마는 파랑·흰색만(빨강·흰색은 크메르루주 연상), 인도는 연꽃 대신 페이즐리·공작(연꽃은 집권당 상징 논란), 네팔은 기도 깃발 대신 다카 직물, 러시아는 자작나무·그젤, 일본은 욱일 문양 금지. 인사말은 원어민 검수 전이다.

글꼴: 영문 제목 Bricolage Grotesque, 본문과 한글 Asta Sans(디자인 스킬 폰트 데이터에서 선택).

## 실행

```bash
npm install
cp .env.example .env.local        # DATABASE_URL, SESSION_SECRET, ADMIN_EMAILS 채우기
npm run db                        # 스키마 + 가상 시드 데이터 (example.com 계정)
npm run dev
```

로컬 Postgres가 없으면 PGlite로 띄운다: `npx -p @electric-sql/pglite-socket pglite-server --db=./.pgdata --port=5439 -m 10`
그리고 `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5439/postgres`.

`EMAIL_SENDER`가 비어 있으면 개발 모드에서 로그인 코드를 메일 대신 화면과 콘솔에 보여 준다. 프로덕션에서는 SMTP가 없으면 코드 발송이 실패한다.

## 검사

```bash
npm run lint
npm run i18n                      # t("한국어") 키마다 src/lib/en.ts 영어 문구가 있는지, 언어별 빠진 줄 수
node scripts/i18n-translate.mjs   # en.ts 에 새로 생긴 줄만 14개 언어로 기계 번역해 locales/*.json 에 추가
BASE_URL=http://localhost:3000 npm run e2e   # dev 서버 대상: 가입→글→익명 호칭→공감·저장·대댓글→새 답변 알림→해결·수정→검색→신고→차단→운영자 가리기→탈퇴
```

CI(`.github/workflows/ci-cd.yml`)는 Postgres 서비스 위에서 lint, i18n, build, e2e를 돈다.

## 구조

- `src/app/(app)/` 피드 · 검색 · 글쓰기/수정 · 글 · 신고 · 내 글(저장한 글) · 공식 안내 · 설정 · 운영 큐 (`/admin`, `ADMIN_EMAILS`만)
- `src/app/login/` 문화별 로그인 (이메일 6자리 코드 → 공개 국적 선택)
- `src/app/actions.ts` 모든 쓰기 동작 (Server Actions)
- `src/lib/` `auth.ts` 세션·코드, `posts.ts` 조회, `cultures.ts` 테마, `guide.ts` 공식 안내, `i18n.ts` + `en.ts` + `locales/` UI 문구, `messages.ts` 언어별 사전
- `src/components/Icon.tsx` SVG 아이콘(이모지 대신), `public/flags/` SVG 국기(country-flag-icons, MIT — Windows는 이모지 국기를 글자로 보여 줌)
- `db/schema.sql` 스키마 `boundless` (재실행 안전), `db/seed.sql` 가상 데이터

공개되는 정보는 자기신고 국적과 글마다 다른 익명 호칭(글쓴이 / 이웃 1, 2…)뿐이다. 이메일은 로그인에만 쓴다.

## 팀 결정 대기 중인 정책 (임시값)

코드에 `ponytail:` 주석으로 표시해 두었다.

- P01 가입 연령: 만 14세 이상 체크박스 (`completeSignup`)
- P02 국적 정정: 본인 변경, 30일에 한 번 (`updateNationality`)
- P03 재심: 미구현. 운영자 "가리기 / 문제 없음" 한 번으로 종료
- P04 탈퇴 후 데이터: 즉시 삭제(글·댓글·신고 cascade) (`deleteAccount`)

## 배포

- 앱: Vercel https://boundless-virid.vercel.app (DB: Neon, 싱가포르). `main` 에 푸시하면 CI 통과 후 자동 배포된다.
- oracle_vm 에는 샘플 DB 만 있다(스키마 `boundless`, 가상 데이터).
- 환경변수, `VERCEL_TOKEN` 등록, 시연용 데이터 정리, 나중에 다른 클라우드 서버로 옮기는 절차: [docs/DEPLOY.md](docs/DEPLOY.md)
