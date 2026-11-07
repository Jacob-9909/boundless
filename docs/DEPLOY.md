# Boundless 배포 · 서버 이전 가이드

## 지금 상태 (2026-11-07)

| | 위치 | 비고 |
| --- | --- | --- |
| 코드 | GitHub `Jacob-9909/boundless` (private) | `main` 푸시 시 CI(lint · i18n · build · e2e) |
| 샘플 DB | oracle_vm PostgreSQL 17, `postgres` DB의 스키마 `boundless`, 전용 역할 `boundless` | 가상 시드 데이터만 있음. 외부 포트 막힘, SSH 터널로만 접속 |
| 앱 서버 | 없음 | 다른 클라우드 서버에 새로 올릴 예정 |

oracle_vm 샘플 DB 접속 (로컬에서):

```bash
ssh -fN -L 5434:127.0.0.1:5432 oracle_vm
# .env.local 의 주석 처리된 oracle_vm DATABASE_URL 을 켜고 npm run dev
```

비밀번호는 로컬 `.env.local`에만 있다. 저장소에는 없다.

## 새 클라우드 서버에 올리기

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

### 5. 자동 배포 켜기

GitHub 저장소 설정:

- Secrets: `VM_SSH_KEY`(배포 전용 키), `VM_KNOWN_HOSTS`(`ssh-keyscan <host>`), `VM_HOST`
- Variables: `DEPLOY_ENABLED=true`
- 서버 `~/.ssh/authorized_keys`에서 그 키를 `command="~/boundless/src/deploy/deploy.sh",no-port-forwarding,no-pty ssh-ed25519 ...`로 제한

이후 `main` 푸시 → CI 통과 → SSH로 `deploy.sh` 실행 → health 실패 시 직전 빌드로 롤백.

### 6. 데이터 옮기기 (필요할 때만)

oracle_vm 샘플 DB에는 가상 데이터만 있으므로 보통은 옮기지 않고 빈 스키마로 시작한다. 실제 데이터가 생긴 뒤 옮길 때:

```bash
ssh oracle_vm "sudo -u postgres pg_dump -n boundless --no-owner postgres" > boundless.sql
psql "$NEW_DATABASE_URL" -f boundless.sql
```

## 출시 전 체크리스트

- [ ] SMTP 설정 후 실제 메일로 가입 테스트
- [ ] `ADMIN_EMAILS` 지정, 운영 큐 접근 확인
- [ ] 개인정보 처리방침 · 이용약관 페이지 (이메일 수집 · 보관 기간 · 국외 이전 여부). 서버가 해외 리전이면 국외 이전 고지가 필요하다
- [ ] 팀 정책 확정 후 임시값 교체: 가입 연령(P01), 국적 정정(P02), 재심(P03), 탈퇴 데이터(P04) — 코드에서 `ponytail:` 주석으로 검색
- [ ] DB 백업 (`pg_dump` 타이머 또는 관리형 DB 자동 백업)
- [ ] 문화별 인사말을 각 언어 원어민에게 검수 (특히 크메르어 · 네팔어 · 힌디어)
