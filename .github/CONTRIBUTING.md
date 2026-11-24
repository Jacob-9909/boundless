# 기여 가이드

## 작업 흐름

1. `main`에서 브랜치를 만듭니다. `main`에 직접 푸시하지 않습니다.
2. 변경을 작게 나눠 커밋하고, 로컬 검사를 통과시킨 뒤 PR을 엽니다.
3. CI가 모두 통과하고 리뷰가 끝나면 merge commit으로 병합합니다. `main`에 병합되면 자동으로 운영 배포됩니다.
4. 병합한 브랜치는 지웁니다.

### 브랜치 이름

| 접두사 | 용도 | 예 |
| --- | --- | --- |
| `feat/` | 새 기능 | `feat/bojagi-logo` |
| `fix/` | 버그 수정 | `fix/intro-link-desktop` |
| `docs/` | 문서만 바꿈 | `docs/feature-logic` |
| `chore/` | 설정, 의존성, 정리 | `chore/remove-coderabbit` |

### 커밋 메시지

[Conventional Commits](https://www.conventionalcommits.org/) 형식을 씁니다. 제목은 영어 명령형으로 짧게 쓰고, 본문에는 무엇을 왜 바꿨는지 적습니다.

```text
feat(brand): redraw the logo as a jogakbo ㅂ

The gradient ㅂ read as generic. The new mark sews ㅂ from patches in
Seoul subway line colors.
```

자주 쓰는 타입: `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`

## 로컬 검사

PR을 열기 전에 CI와 같은 검사를 돌립니다.

```bash
npm run lint
npm run i18n
node --no-warnings scripts/moderation-check.mjs
node --no-warnings scripts/ai-check.mjs
node --no-warnings scripts/avatar-check.mjs
npm run build
BASE_URL=http://localhost:3000 npm run e2e   # 개발 서버를 띄운 상태에서
```

## 규칙

- **화면 문구:** 새 문구는 `t("한국어 문장")`으로 쓰고 `src/lib/en.ts`에 영어를 추가합니다. 다른 언어는 `src/lib/locales/*.json`에 넣습니다. `npm run i18n`이 빠진 줄을 알려 줍니다.
- **스키마:** `db/migrations/`에 다음 번호로 새 파일을 추가합니다. 이미 적용된 파일은 고치지 않고, 컬럼 삭제·이름 변경은 expand/contract 두 단계로 나눕니다. 자세한 규칙은 [docs/DEPLOY.md](../docs/DEPLOY.md#스키마-변경-마이그레이션)에 있습니다.
- **UI:** Astryx 컴포넌트를 먼저 씁니다([docs/ASTRYX.md](../docs/ASTRYX.md)).
- **비밀값:** `.env*` 파일과 토큰은 커밋하지 않습니다. 새 환경 변수는 `.env.example`과 `docs/DEPLOY.md` 표에 함께 적습니다.
- **Next.js:** 이 프로젝트의 Next.js 버전은 이전 버전과 API가 다릅니다. 코드를 쓰기 전에 `node_modules/next/dist/docs/`를 확인합니다([AGENTS.md](../AGENTS.md)).

## 보안 문제

취약점은 이슈로 올리지 말고 [SECURITY.md](SECURITY.md)의 절차를 따릅니다.
