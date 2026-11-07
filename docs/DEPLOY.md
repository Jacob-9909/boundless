# Boundless 배포 · 서버 이전 가이드

## 지금 상태 (2026-11-07)

| | 위치 | 비고 |
| --- | --- | --- |
| 코드 | GitHub `Jacob-9909/boundless` (private) | |
| 앱 | Vercel 프로젝트 `boundless` → https://boundless-virid.vercel.app | 함수 리전 `sin1`(싱가포르, `vercel.json`) |
| 운영 DB | Neon Postgres `boundless-db` (Vercel Marketplace, `sin1`) | `DATABASE_URL`(풀링)·`DATABASE_URL_UNPOOLED` 자동 주입. production·preview 가 같은 DB 를 씀 |
| 샘플 DB | oracle_vm PostgreSQL 17, 스키마 `boundless`, 역할 `boundless` | 가상 데이터만. 외부 포트 막힘, SSH 터널로만 접속 |

Neon 은 서울·도쿄 리전을 고를 수 없어 가장 가까운 싱가포르를 썼고, DB 왕복을 줄이려고 함수도 같은 리전에 두었다.

### CI/CD (`.github/workflows/ci-cd.yml`)

- **CI** — 모든 PR 과 `main` 푸시: lint → i18n 키 검사 → build → Postgres 서비스 위에서 e2e
- **CD** — `main` 푸시에서 CI 가 통과한 뒤에만: `vercel pull` → `db/schema.sql` 적용(재실행 안전) → `vercel build --prod` → `vercel deploy --prebuilt --prod` → `/api/health` 확인
- 필요한 저장소 시크릿은 `VERCEL_TOKEN` 하나. 프로젝트·조직 ID 는 비밀이 아니라 워크플로에 적어 두었다

`VERCEL_TOKEN` 등록 (한 번만, 이 프로젝트 전용 토큰):

```bash
npx vercel tokens create "boundless GitHub Actions" --project boundless
# 출력된 토큰을 복사해서
gh secret set VERCEL_TOKEN -R Jacob-9909/boundless   # 붙여넣고 Enter
```

또는 GitHub 저장소 Settings → Secrets and variables → Actions → New repository secret.

### Vercel 환경변수

| 이름 | production | preview | 설명 |
| --- | --- | --- | --- |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` 등 | ✓ | ✓ | Neon 연동이 자동 관리 |
| `SESSION_SECRET` | ✓ | ✓ | 환경별 무작위 값 |
| `DEMO_LOGIN=1` | ✓ | ✓ | 시연용. 첫 화면 "심사위원 · 체험용 샘플 계정"에서 나라를 누르면 그 나라 샘플 이웃(`<코드>@example.com`)으로 바로 입장, 운영자 화면은 읽기 전용 계정(`moderator@example.com`)으로 입장. `@example.com` 계정은 로그인 코드도 화면에 보여 주고, 운영 처리 권한은 받지 못함. 실제 출시 때 지운다 |
| `EMAIL_SENDER`, `EMAIL_PASSWORD` | 미설정 | | Gmail 앱 비밀번호. **설정 전에는 실제 이메일로 가입할 수 없다** |
| `ADMIN_EMAILS` | 미설정 | | 운영 큐(`/admin`) 를 볼 실제 이메일 |

```bash
npx vercel env add EMAIL_SENDER production
npx vercel env add EMAIL_PASSWORD production --sensitive
npx vercel env add ADMIN_EMAILS production
```

추가한 뒤 `main` 에 푸시하거나 Actions 에서 워크플로를 다시 실행하면 반영된다.

운영 DB 에는 시연용 가상 데이터(`db/seed.sql`)가 들어 있다. 실제 운영 전에 지우려면:

```sql
DELETE FROM boundless.users WHERE email LIKE '%@example.com';
```

### oracle_vm 샘플 DB 접속

```bash
ssh -fN -L 5434:127.0.0.1:5432 oracle_vm
# .env.local 의 주석 처리된 oracle_vm DATABASE_URL 을 켜고 npm run dev
```

비밀번호는 로컬 `.env.local`에만 있다.

## (나중에) 다른 클라우드 서버로 옮기기

Vercel 대신 직접 운영하는 서버로 옮길 때의 절차다.

어느 클라우드든(AWS Lightsail/EC2, GCP, Azure, NCP, OCI) 리눅스 VM 한 대면 된다. 저장소의 `deploy/`가 그 구성을 전제로 한다.

### 1. 서버 준비

- Ubuntu 22.04/24.04, 2 vCPU · 2GB 이상 (빌드를 서버에서 하므로 메모리 2GB 미만이면 swap 추가)
- Node.js 24, git, Caddy (TLS 자동 발급)
- PostgreSQL 17: 같은 서버에 두거나 관리형 DB(RDS, Cloud SQL, Neon, Supabase 등) 사용
- 방화벽: 22, 80, 443만 연다. 5432는 외부에 열지 않는다

### 2. DB

```sql
-- 관리자 계정으로
CREATE ROLE boundless LOGIN PASSWORD '<강한 비밀번호>';
CREATE SCHEMA boundless AUTHORIZATION boundless;
```

스키마는 배포 스크립트가 매번 `db/schema.sql`로 적용한다(재실행 안전). **운영에는 `db/seed.sql`을 넣지 않는다.**
관리형 DB에서 스키마 생성 권한이 없으면 위 두 줄만 콘솔에서 실행하면 된다.

### 3. 앱

```bash
git clone git@github.com:Jacob-9909/boundless.git ~/boundless/src
cp ~/boundless/src/.env.example ~/boundless/.env   # 아래 표대로 채우기, chmod 600
sudo cp ~/boundless/src/deploy/boundless.service /etc/systemd/system/
# 사용자명이 ubuntu 가 아니면 서비스 파일의 User / 경로를 고친다
sudo systemctl daemon-reload && sudo systemctl enable boundless
~/boundless/src/deploy/deploy.sh                    # 첫 빌드 + 기동 + /api/health 확인
```

| 환경변수 | 값 |
| --- | --- |
| `DATABASE_URL` | `postgres://boundless:<pw>@<host>:5432/postgres` (관리형 DB면 그쪽 DB 이름) |
| `SESSION_SECRET` | `openssl rand -base64 32` |
| `EMAIL_SENDER` / `EMAIL_PASSWORD` | Gmail 주소와 앱 비밀번호. 운영에서는 필수 (없으면 로그인 코드 발송 실패) |
| `ADMIN_EMAILS` | 운영 큐(`/admin`)를 볼 이메일, 쉼표 구분 |

### 4. 도메인 · TLS

```caddy
boundless.example.com {
  reverse_proxy 127.0.0.1:8040
}
```

`sudo systemctl reload caddy` 후 `curl -s https://boundless.example.com/api/health` → `{"ok":true}`.

### 5. 자동 배포 바꾸기

워크플로의 `deploy` 잡을 Vercel 단계 대신 SSH 배포로 바꾼다 (triplan 과 같은 방식):

```yaml
      - name: Deploy to VM
        env:
          SSH_KEY: ${{ secrets.VM_SSH_KEY }}
          KNOWN_HOSTS: ${{ secrets.VM_KNOWN_HOSTS }}
          VM_HOST: ${{ secrets.VM_HOST }}
        run: |
          mkdir -p ~/.ssh
          printf '%s\n' "$SSH_KEY" > ~/.ssh/id_ed25519
          printf '%s\n' "$KNOWN_HOSTS" > ~/.ssh/known_hosts
          chmod 600 ~/.ssh/id_ed25519
          ssh "ubuntu@$VM_HOST" deploy
```

- Secrets: `VM_SSH_KEY`(배포 전용 키), `VM_KNOWN_HOSTS`(`ssh-keyscan <host>`), `VM_HOST`
- 서버 `~/.ssh/authorized_keys`에서 그 키를 `command="~/boundless/src/deploy/deploy.sh",no-port-forwarding,no-pty ssh-ed25519 ...`로 제한

이후 `main` 푸시 → CI 통과 → SSH로 `deploy.sh` 실행 → health 실패 시 직전 빌드로 롤백.

### 6. 데이터 옮기기

Neon 운영 DB 에서 새 서버로:

```bash
pg_dump "$NEON_DATABASE_URL_UNPOOLED" -n boundless --no-owner > boundless.sql
psql "$NEW_DATABASE_URL" -f boundless.sql
```

## 출시 전 체크리스트

- [ ] SMTP 설정 후 실제 메일로 가입 테스트
- [ ] `ADMIN_EMAILS` 지정, 운영 큐 접근 확인
- [ ] 개인정보 처리방침 · 이용약관 페이지 (이메일 수집 · 보관 기간 · 국외 이전 여부). 서버가 해외 리전이면 국외 이전 고지가 필요하다
- [ ] 팀 정책 확정 후 임시값 교체: 가입 연령(P01), 국적 정정(P02), 재심(P03), 탈퇴 데이터(P04) — 코드에서 `ponytail:` 주석으로 검색
- [ ] DB 백업 (`pg_dump` 타이머 또는 관리형 DB 자동 백업)
- [ ] 문화별 인사말을 각 언어 원어민에게 검수 (특히 크메르어 · 네팔어 · 힌디어)
- [ ] 화면 문구 기계 번역(`src/lib/locales/*.json`)을 원어민 검수. 번역 스크립트는 Google 무료 웹 엔드포인트라 요청이 많으면 429 로 막힌다. 출시 전 유료 번역 API 나 사람 번역으로 교체
