# Boundless 배포 · 서버 이전 가이드

## 지금 상태 (2026-11-18)

| | 위치 | 비고 |
| --- | --- | --- |
| 코드 | GitHub `Jacob-9909/boundless` (private) | |
| 앱 | Vercel 프로젝트 `boundless` → https://boundless-virid.vercel.app | 함수 리전 `sin1`(싱가포르, `vercel.json`) |
| 운영 DB | Neon Postgres `boundless-db` (Vercel Marketplace, `sin1`) | `DATABASE_URL`(풀링)·`DATABASE_URL_UNPOOLED` 자동 주입. production·preview 가 같은 DB 를 씀 |
| 샘플 DB | oracle_vm PostgreSQL 17, 스키마 `boundless`, 역할 `boundless` | 가상 데이터만. 외부 포트 막힘, SSH 터널로만 접속 |

Neon 은 서울·도쿄 리전을 고를 수 없어 가장 가까운 싱가포르를 썼고, DB 왕복을 줄이려고 함수도 같은 리전에 두었다.

### CI/CD (`.github/workflows/ci-cd.yml`)

- **CI** — 모든 PR 과 `main` 푸시: lint → i18n 키 검사 → 금칙어·AI 파서·아바타 검사(`scripts/*-check.mjs`) → build → Postgres 서비스 위에서 e2e
- **CD** — `main` 푸시에서 CI 가 통과한 뒤에만: `vercel pull` → 밀린 마이그레이션 적용(`db/migrations`, 아래 "스키마 변경") → `vercel build --prod` → `vercel deploy --prebuilt --prod` → `/api/health` 확인
- **Backup** (`backup.yml`) — 매일 03:00 KST 운영 DB 덤프 → 암호화 → 임시 Postgres 에 복원해 행 수 확인 → 7일 보관 (아래 "백업과 복구")
- **Uptime** (`uptime.yml`) — 매시 `/api/health` 확인, 실패하면 GitHub 메일과 웹훅 알림 (아래 "모니터링과 알림")
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
| `EMAIL_SENDER`, `EMAIL_PASSWORD` | **미설정** (11-18 운영자 화면에서 확인) | | Gmail 주소와 앱 비밀번호. **설정 전에는 실제 이메일로 가입할 수 없다**(샘플 계정은 영향 없음). 아래 "로그인 메일" 참고 |
| `ADMIN_EMAILS` | 미설정 | | 운영 큐(`/admin`) 를 볼 실제 이메일 |
| `NVIDIA_API_KEY` | 설정됨 (11-18 운영자 화면에서 확인) | | NVIDIA NIM 키(build.nvidia.com). 글 자동 분류(비자·지역·위기), 해결된 글의 AI 요약, 글쓰기 AI 점검에 쓴다. 없으면 이 기능들이 화면에 나오지 않을 뿐 나머지는 그대로 동작하고, 자해 표현만 정규식으로 잡는다 |
| `CRON_SECRET` | 설정됨 (11-21, 첫 호출 200 확인) | | 매일 정리 작업(`/api/cron/cleanup`)의 인증값. Vercel Cron 이 `Authorization: Bearer` 로 보낸다. 없으면 정리 작업이 401 로 거절돼 오래된 요청 기록·만료 코드·삭제된 사진 파일이 쌓인다 |
| `BLOB_READ_WRITE_TOKEN` | 연결됨 (11-21) | ✓ | 비공개 Blob 저장소 `boundless-images`(`sin1`)를 연결하면 자동으로 들어온다(OIDC 로 연결한 저장소는 `BLOB_STORE_ID`). 둘 다 없으면 사진을 예전처럼 Postgres 에 저장한다. 연결할 때 운영 DB 사진은 0장이라 옮길 것이 없었다. 아래 "사진 저장소" |
| `ALERT_WEBHOOK_URL` | 선택 | | Slack·Discord 수신 웹훅. 서버 오류를 종류별로 10분에 한 번 보낸다. 같은 값을 GitHub 저장소 시크릿에도 넣으면 업타임 실패도 온다 |
| `PRIVACY_CONTACT` | 선택 | | 운영 정책 "개인정보 국외 처리" 끝에 보이는 개인정보 문의처(팀 공용 메일 등). 개인 메일은 넣지 않는다 |

```bash
npx vercel env add EMAIL_SENDER production
npx vercel env add EMAIL_PASSWORD production --sensitive
npx vercel env add ADMIN_EMAILS production
npx vercel env add NVIDIA_API_KEY production --sensitive
openssl rand -base64 32 | npx vercel env add CRON_SECRET production --sensitive
```

추가한 뒤 `main` 에 푸시하거나 Actions 에서 워크플로를 다시 실행하면 반영된다.

운영자 화면(`/admin`) 맨 위 대시보드의 **시스템 상태**가 운영 서버 기준으로 AI(NVIDIA NIM), 로그인 메일(Gmail SMTP), 체험 계정이 켜져 있는지 보여 준다. 값은 보여 주지 않고 켜짐·꺼짐만 보여 주므로, 환경변수를 바꾼 뒤 여기서 반영 여부를 확인하면 된다.

운영 DB 에는 시연용 가상 데이터(`db/seed.sql`)가 들어 있다. 실제 운영 전에 지우려면:

```sql
DELETE FROM boundless.users WHERE email LIKE '%@example.com';
```

### 로그인 메일 (Gmail SMTP)

로그인 코드는 일반 Gmail 계정에서 앱 비밀번호로 보낸다(`src/lib/mail.ts`, gov24 와 같은 방식). AWS SES 같은 대량 발송 승인은 필요 없다.

1. 보낼 Gmail 계정에서 2단계 인증을 켠다.
2. Google 계정 → 보안 → 앱 비밀번호에서 16자리 비밀번호를 만든다.
3. 위 명령으로 `EMAIL_SENDER`(Gmail 주소)와 `EMAIL_PASSWORD`(앱 비밀번호)를 production 에 넣고 다시 배포한다.
4. 운영자 화면 시스템 상태가 "설정됨"이 되면, 실제 주소로 코드를 받아 본다.

- 한도: 개인 Gmail 은 하루 약 500통(Workspace 약 2,000통). 로그인 코드는 사람마다 한 통이라 시연·시범 운영 규모에서는 충분하다.
- 앱이 막는 것: 같은 이메일은 60초에 한 번·하루 10번, 같은 네트워크(IP, 해시로만 기록)는 1시간에 20번까지 코드를 요청할 수 있다. 메일 발송이 실패하면 그 코드를 무효로 하고 바로 다시 요청할 수 있게 하며, SMTP 가 응답하지 않으면 10~20초 안에 포기한다.
- 나중에 바꿀 때: 하루 수백 건이 넘거나, `noreply@<서비스 도메인>` 으로 보내고 싶거나, 스팸함 비율을 낮추려면 Resend·AWS SES 같은 발송 서비스로 옮긴다. SES 는 처음에 샌드박스(인증한 주소로만, 하루 200통)라 production access 승인이 필요하고, Resend 는 승인 없이 쓰되 다른 사람에게 보내려면 도메인 인증(SPF·DKIM)이 필요하다.

### 스키마 변경 (마이그레이션)

스키마는 `db/migrations/NNNN_이름.sql` 파일들이다. `node scripts/db.mjs db/migrations` 가 아직 안 들어간 파일만 번호 순서로, 파일마다 트랜잭션 하나로 적용하고 `boundless.schema_migrations` 에 기록한다. 실패한 파일은 통째로 되돌아가고 다음 배포가 다시 시도한다. 두 배포가 겹치면 advisory lock 으로 하나씩 돈다.

- 새 변경은 **새 파일**로 추가한다. 이미 적용된 파일은 고치거나 이름을 바꾸지 않는다(파일 이름이 기록 키다).
- 마이그레이션은 새 코드가 올라가기 **전에** 돈다. 그동안 옛 코드가 계속 요청을 받으므로, 옛 코드가 쓰는 컬럼·테이블을 같은 배포에서 지우거나 이름을 바꾸지 않는다(expand/contract).
  1. 배포 A: 새 컬럼·테이블을 추가한다(expand). 코드는 둘 다 읽거나 새 쪽에 쓴다.
  2. 데이터를 옮겨야 하면 스크립트로 옮긴다.
  3. 배포 B: 옛 컬럼을 더는 안 쓰는 코드가 운영에 나간 **다음** 배포에서 지운다(contract).
- 되돌리기: 코드는 Vercel 에서 이전 배포를 Promote 한다. 스키마는 앞으로만 간다. expand 만 했다면 옛 코드가 새 스키마에서 그대로 돈다. 꼭 되돌려야 하면 반대 동작을 하는 새 마이그레이션을 추가한다.
- `0001_baseline.sql` 은 예전 `db/schema.sql` 이다. 재실행 안전이라 이미 스키마가 있는 운영 DB 에서는 기록만 된다.
- 인덱스 생성은 트랜잭션 안에서 테이블 쓰기를 잠근다. 테이블이 수백만 행이 되면 그 인덱스만 콘솔에서 `CREATE INDEX CONCURRENTLY` 로 먼저 만들고, 파일에는 `IF NOT EXISTS` 로 둔다.

### 운영진 역할

- **운영자**(moderator): 신고 처리(가리기·문제 없음), 재심 처리(복구·유지)
- **관리자**(admin): 운영자 권한에 더해, `/admin` 맨 아래 "운영진"에서 회원 이메일로 역할을 주고 뺀다
- `ADMIN_EMAILS` 에 있는 주소는 DB 역할과 상관없이 관리자다. 첫 관리자를 만드는 방법이자, 실수로 모두 권한을 잃었을 때 돌아오는 길이다. 자기 역할과 `ADMIN_EMAILS` 관리자의 역할은 화면에서 바꿀 수 없다
- 샘플 계정(`@example.com`, 체험용 운영자 포함)은 어떤 역할도 받지 못한다
- 모든 결정은 `boundless.staff_log` 에 누가·언제·무엇을 했는지 남고, `/admin` "처리 기록"에 최근 30건이 보인다. 이메일은 관리자에게만 그대로 보이고, 운영자와 체험용 운영자에게는 가려진다

### 사진 저장소 (Vercel Blob)

Blob 저장소가 연결돼 있으면 새 사진은 비공개 Blob 에 올라가고 DB 에는 경로만 남는다. 연결이 없으면(로컬, CI, 자체 서버) 예전처럼 Postgres 에 저장한다. 두 경우 모두 `/api/img/<id>` 가 같은 공개 규칙(가려진 글 사진은 404, 라운지 사진은 같은 국적만)으로 내려 준다.

```bash
npx vercel blob create-store boundless-images --access private   # 만든 뒤 프로젝트(production, preview)에 연결
# 이미 DB 에 있는 사진 옮기기 (한 번만, 다시 돌려도 안전)
DATABASE_URL=<운영 DATABASE_URL_UNPOOLED> BLOB_READ_WRITE_TOKEN=<저장소 토큰> node scripts/images-to-blob.mjs
```

사진 행이 지워지면(글 수정·삭제, 탈퇴의 연쇄 삭제 포함) DB 트리거가 그 파일 경로를 `boundless.blob_trash` 에 넣는다. 행은 바로 사라지므로 사진은 그 순간부터 404 다. 파일 자체는 삭제 동작 직후와 매일 정리 작업에서 지운다.

### 모니터링과 알림

- **서버 오류**: `src/instrumentation.ts` 가 페이지·라우트·서버 액션에서 잡히지 않은 오류를 JSON 한 줄로 남긴다(`level`, `where`, `path`, `digest`, `build`). 요청 헤더와 쿠키는 남기지 않는다. Vercel → Logs 에서 `"level":"error"` 로 찾는다. 사용자가 보는 오류 화면의 digest 와 같은 값이다. `ALERT_WEBHOOK_URL` 이 있으면 같은 오류를 종류별로 10분에 한 번 웹훅으로도 보낸다.
- **가동 확인**: `uptime.yml` 이 매시 `/api/health` 를 부른다. DB 에 닿지 못하면 503 이다. GitHub 은 실패한 예약 실행을 cron 줄을 마지막으로 바꾼 사람에게만, 그 사람의 Actions 알림이 켜져 있을 때만 메일로 보낸다. 모두가 보는 알림은 저장소 시크릿 `ALERT_WEBHOOK_URL` 이니 꼭 설정한다. 무료 Actions 시간 안에 두려고 매시로 했다. 1~5분 간격이 필요하면 UptimeRobot·Better Stack 같은 외부 모니터에 같은 URL 을 건다.
- Sentry 같은 오류 추적 서비스를 붙일 때는 `src/instrumentation.ts` 한 곳만 바꾸면 된다.

### 백업과 복구

| | 무엇 | 복구 시점 | 보관 |
| --- | --- | --- | --- |
| 1차 | Neon 시점 복구(PITR, 브랜치 복원) | 보관 기간 안의 아무 시점 | Neon 플랜에 따름. 콘솔 → Project settings 에서 확인 |
| 2차 | `backup.yml` 매일 논리 백업(`pg_dump`, AES-256 암호화) | 마지막 백업 시점(최대 24시간 전) | GitHub Actions 아티팩트 7일 |

- **목표**: RPO 24시간(Neon 자체를 잃는 최악의 경우), RTO 1시간.
- **운영 정책과 맞출 것**: `/policy` 는 "백업에 최대 7일 남는다"고 안내한다. Neon 보관 기간을 7일보다 길게 바꾸면 정책 문구도 같이 고친다.
- **필요한 시크릿**: `BACKUP_PASSPHRASE`(긴 무작위 문자열). 이 값이 없으면 아무도 백업을 풀 수 없으니 GitHub 밖에도 보관한다. 지금 값의 사본은 관리자 Mac 키체인의 `boundless-backup-passphrase` 항목에 있다(`security find-generic-password -s boundless-backup-passphrase -w`). 팀 비밀번호 관리자로도 옮겨 둔다. `CRON_SECRET` 사본은 `boundless-cron-secret` 항목이다.
- **버전**: Neon 은 PostgreSQL 18 이다. 워크플로가 서버 버전을 읽어 같은 버전의 `pg_dump` 와 복원 서버를 쓴다. 손으로 복구할 때도 그 버전 이상의 클라이언트를 쓴다.

```bash
openssl rand -base64 32                               # 출력값을 비밀번호 관리자에 먼저 저장
gh secret set BACKUP_PASSPHRASE -R Jacob-9909/boundless
gh workflow run backup.yml -R Jacob-9909/boundless    # 첫 실행으로 확인
```

매 실행이 덤프를 임시 Postgres 에 실제로 복원하고 회원·글·댓글 수와 마지막 마이그레이션을 출력한다. 그래서 "복원할 수 있는 백업"인지가 매일 확인된다.

**복구 절차 1 — Neon PITR (실수로 지운 데이터, 잘못된 마이그레이션)**

1. Neon 콘솔 → Branches → Restore 에서 사고 직전 시점으로 새 브랜치를 만든다. 운영 브랜치는 건드리지 않는다.
2. 새 브랜치에서 데이터를 확인한다. 일부만 필요하면 그 행만 운영으로 복사하고, 전체가 필요하면 그 브랜치를 운영으로 승격한다.
3. 승격했다면 Vercel 의 `DATABASE_URL`·`DATABASE_URL_UNPOOLED` 가 새 브랜치를 가리키는지 확인하고 다시 배포한다.

**복구 절차 2 — GitHub 백업 (Neon 을 쓸 수 없을 때, 다른 DB 로 옮길 때)**

```bash
gh run download -R Jacob-9909/boundless -n <boundless-YYYYMMDD-HHMM.dump.enc>   # Actions → Backup 실행에서 이름 확인
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in boundless-*.dump.enc -out restore.dump   # BACKUP_PASSPHRASE 입력
psql "$NEW_DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm"
pg_restore -d "$NEW_DATABASE_URL" --no-owner --exit-on-error restore.dump
rm restore.dump
```

그다음 `DATABASE_URL="$NEW_DATABASE_URL" node scripts/db.mjs db/migrations` 로 이후 마이그레이션을 맞추고, `DATABASE_URL` 을 바꿔 배포한 뒤 `/api/health` 를 확인한다. **분기마다 한 번** 이 절차를 빈 DB 에 실제로 해 보고 걸린 시간을 여기에 적는다.

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

스키마는 배포 스크립트가 매번 `db/migrations`의 밀린 파일만 적용한다(위 "스키마 변경"). **운영에는 `db/seed.sql`을 넣지 않는다.**
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
| `DATABASE_URL` | `postgres://boundless:<pw>@<host>:5432/postgres` (관리형 DB면 그쪽 DB 이름). localhost 가 아니면 TLS 인증서를 검증한다. AWS RDS 처럼 자체 CA 를 쓰는 DB 는 그 CA 파일을 받아 `NODE_EXTRA_CA_CERTS=/path/ca.pem` 을 함께 넣는다 |
| `SESSION_SECRET` | `openssl rand -base64 32` |
| `EMAIL_SENDER` / `EMAIL_PASSWORD` | Gmail 주소와 앱 비밀번호. 운영에서는 필수 (없으면 로그인 코드 발송 실패) |
| `ADMIN_EMAILS` | 운영 큐(`/admin`)를 볼 이메일, 쉼표 구분 |
| `NVIDIA_API_KEY` | 선택. AI 요약·글쓰기 점검용 NVIDIA NIM 키 |
| `CRON_SECRET` | `openssl rand -base64 32`. 아래 정리 작업 crontab 이 같은 값을 보낸다 |
| `ALERT_WEBHOOK_URL`, `PRIVACY_CONTACT` | 선택. 위 Vercel 환경변수 표와 같다 |

Vercel Cron 이 없으니 매일 정리 작업은 crontab 으로 부른다:

```bash
# crontab -e  (04:00 KST, 서버 시간대가 UTC 라면 19시)
0 19 * * * . $HOME/boundless/.env && curl -fsS -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:8040/api/cron/cleanup > /dev/null
```

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

- [ ] `EMAIL_SENDER`·`EMAIL_PASSWORD` 설정 → 운영자 화면 시스템 상태 "설정됨" 확인 → 실제 메일로 가입 테스트
- [ ] `ADMIN_EMAILS` 지정, 운영 큐 접근 확인
- [x] 운영 정책에 보관 기간과 개인정보 국외 처리(업체·국가·항목·기간·거부 방법) 고지 (`/policy#retention`, `#overseas`). 가입 동의 문구에도 국외 처리를 넣었다
- [ ] 위 정책 문구 법률 검토, 이용약관 별도 페이지, 개인정보 보호책임자 지정과 `PRIVACY_CONTACT` 설정
- [x] `CRON_SECRET` 설정, 첫 호출 200 확인 (11-21)
- [ ] 팀 정책 확정 후 임시값 교체: 가입 연령(P01), 국적 정정(P02), 재심(P03), 탈퇴 데이터(P04) — 코드에서 `ponytail:` 주석으로 검색
- [x] `BACKUP_PASSPHRASE` 시크릿 등록, Backup 첫 실행 성공(복원 확인: 회원 62·글 59·댓글 255) (11-21)
- [ ] Neon PITR 보관 기간 확인(정책의 "최대 7일"과 맞추기)
- [x] Blob 저장소 연결 (11-21). 운영 DB 사진은 0장이라 옮길 것 없음
- [ ] `ALERT_WEBHOOK_URL`(Vercel 환경변수와 GitHub 시크릿) 설정 후 알림 받아 보기
- [ ] 문화별 인사말을 각 언어 원어민에게 검수 (특히 크메르어 · 네팔어 · 힌디어)
- [ ] 화면 문구 기계 번역(`src/lib/locales/*.json`)을 원어민 검수. 대부분은 Google 무료 웹 엔드포인트로 만들었고(요청이 많으면 429 로 막힘), 프랑스어·힌디어 전체와 재심·운영 정책 문구는 AI가 직접 번역했다. 초기 Google 번역분은 모두 AI가 다시 번역하거나 고쳤다(핵심 용어 63줄, 짧은 메뉴·버튼 700여 줄, 긴 안내 문장 151줄). 원어민 검수는 아직이다. 출시 전 유료 번역 API 나 사람 번역으로 교체
