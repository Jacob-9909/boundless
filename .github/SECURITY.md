# 보안 정책

## 지원 범위

| 대상 | 지원 |
| --- | --- |
| `main` 브랜치와 운영 서비스 (https://boundless-virid.vercel.app) | 지원 |
| 그 밖의 브랜치, 포크, 직접 띄운 서버 | 지원하지 않음 |

## 취약점 제보

공개 이슈나 PR에 취약점을 올리지 마세요.

1. 저장소의 **Security → Report a vulnerability**에서 비공개로 제보합니다 ([GitHub Private Vulnerability Reporting](https://github.com/Jacob-9909/boundless/security/advisories/new)).
2. 재현 절차, 영향 범위, 가능하면 개념 증명(PoC)을 적어 주세요.
3. 다른 이용자의 데이터에 접근하거나, 서비스를 멈추게 하거나, 대량 요청을 보내는 테스트는 하지 마세요. 확인이 필요하면 샘플 계정(`@example.com`)이나 직접 띄운 로컬 환경을 쓰세요.

## 처리 절차

| 단계 | 목표 시간 |
| --- | --- |
| 접수 확인 | 3영업일 안 |
| 영향 평가와 심각도 판단 | 7영업일 안 |
| 수정 배포 | 심각도에 따라 정하고 제보자에게 알림 |

수정이 배포된 뒤 제보자와 협의해 GitHub Security Advisory로 공개합니다.

## 보안 설계 요약

- 요청별 nonce 기반 CSP와 보안 헤더 (`src/proxy.ts`, `next.config.ts`)
- 서명 쿠키 세션과 서버 측 전체 세션 무효화 (`src/lib/auth.ts`)
- 로그인 코드·글·댓글 요청 횟수 제한, IP는 해시로만 기록
- 비공개 사진 저장소와 공개 규칙 검사 (`/api/img`)
- 서버 오류 로그에 요청 헤더와 쿠키를 남기지 않음 (`src/instrumentation.ts`)
- 운영 DB 백업은 AES-256으로 암호화하고 7일 뒤 삭제 (`.github/workflows/backup.yml`)
- Dependabot과 GitGuardian으로 의존성·비밀값 노출 점검

자세한 운영 구성은 [docs/DEPLOY.md](../docs/DEPLOY.md)에 있습니다.
