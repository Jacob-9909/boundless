import Link from "next/link";
import { Card } from "@astryxdesign/core/Card";
import { FilterChip } from "@/components/Feed";
import { Icon, type IconName } from "@/components/Icon";
import { PageHead } from "@/components/ui";
import { getT } from "@/lib/auth";

export const metadata = { title: "Policy" };

/** The rules members agree to at sign-up, in one place: what is public, age, nationality, reports, appeals, deletion. */
export default async function PolicyPage() {
  const { t } = await getT();
  const sections: { id: string; icon: IconName; title: string; lines: string[] }[] = [
    {
      id: "public",
      icon: "lock",
      title: t("공개되는 정보"),
      lines: [
        t("다른 이웃에게는 스스로 고른 국적 하나와, 글마다 새로 붙는 익명 호칭만 보여요."),
        t("이메일은 로그인 코드를 보내는 데만 쓰고 누구에게도 보여 주지 않아요."),
        t("아바타는 직접 켠 경우에만 내 글과 댓글에 보여요. 켜면 같은 아바타라 내 글끼리 이어 볼 수 있어요."),
        t("사진으로 아바타 색을 채울 때 사진은 내 기기 안에서만 쓰고, 서버로 보내거나 저장하지 않아요."),
        t("글에는 이름, 연락처, 정확한 주소, 외국인등록번호를 쓰지 마세요. 지역은 시·도까지만 고를 수 있어요."),
      ],
    },
    {
      id: "age",
      icon: "users",
      title: t("가입 연령"),
      lines: [t("만 14세 이상만 가입할 수 있어요. 가입할 때 확인해요.")],
    },
    {
      id: "nationality",
      icon: "globe",
      title: t("국적 정정"),
      lines: [
        t("국적은 스스로 밝힌 정보예요. 잘못 골랐다면 설정에서 바꿀 수 있어요."),
        t("한 번 바꾸면 30일 동안 다시 바꿀 수 없어요. 이미 쓴 글에도 새 국적이 표시돼요."),
      ],
    },
    {
      id: "reports",
      icon: "siren",
      title: t("신고와 처리"),
      lines: [
        t("개인정보 노출, 혐오·차별, 사기·불법 거래, 광고·도배는 글과 댓글마다 신고할 수 있어요."),
        t("운영자가 확인해 가리거나 문제 없음으로 끝내요. 처리 상태는 설정의 내 신고에서 볼 수 있어요."),
        t("보고 싶지 않은 이웃은 차단할 수 있어요. 차단하면 그 이웃의 글과 댓글이 보이지 않아요."),
      ],
    },
    {
      id: "appeals",
      icon: "reply",
      title: t("재심"),
      lines: [
        t("내 글이나 댓글이 가려지면 그 자리에서 이유를 적어 재심을 한 번 요청할 수 있어요."),
        t("운영자가 다시 확인해 복구하거나 가림을 유지하고, 결과는 같은 자리에 표시돼요."),
      ],
    },
    {
      id: "delete",
      icon: "trash",
      title: t("탈퇴 후 데이터"),
      lines: [
        t("탈퇴하면 계정, 내가 쓴 글과 댓글, 사진, 신고·재심 기록이 바로 지워지고 되돌릴 수 없어요."),
        t("장애 복구용 데이터베이스 백업에는 최대 7일 동안 남았다가 자동으로 지워져요."),
        t("이용 지표(검색·글쓰기 횟수)는 누구인지 알 수 없는 형태로만 남아요."),
      ],
    },
    {
      id: "retention",
      icon: "info",
      title: t("보관 기간"),
      lines: [
        t("계정, 글, 댓글, 사진: 탈퇴하거나 직접 지울 때까지."),
        t("로그인 코드: 10분 동안 유효하고, 만료된 코드는 하루 안에 지워요."),
        t("과도한 요청을 막는 기록: 네트워크 주소를 알아볼 수 없게 바꿔 1시간 동안 쓰고, 2일 안에 지워요."),
        t("이용 지표: 400일이 지나면 지워요."),
      ],
    },
    {
      id: "overseas",
      icon: "external",
      title: t("개인정보 국외 처리"),
      lines: [
        t("Boundless는 아래 해외 서비스에 처리를 맡겨요. 서비스를 제공하려면 꼭 필요해서, 이용하는 동안 인터넷으로 전송돼요."),
        t("Vercel Inc.(미국, 서버는 싱가포르): 앱 실행과 사진 보관. 이메일, 국적, 글·댓글·사진, 접속 기록. 탈퇴할 때까지."),
        t("Neon Inc.(미국, 서버는 싱가포르): 데이터베이스. 회원 정보와 글 전체. 탈퇴할 때까지, 백업은 최대 7일."),
        t("Google LLC(미국): 로그인 코드 메일 발송. 이메일 주소와 로그인 코드."),
        t("NVIDIA Corporation(미국): 글 분류, 해결된 글 요약, 글쓰기 점검. 전화번호·등록번호·이메일을 지운 글 제목과 본문. 결과만 Boundless에 저장해요."),
        t("Translated srl(이탈리아, MyMemory): 번역 버튼을 누른 글과 댓글의 본문. 번역 결과는 Boundless에 저장해요."),
        t("GitHub Inc.(미국): 장애 복구용 백업 파일. 암호화한 데이터베이스 전체. 7일 뒤 자동 삭제."),
        t("국외 처리를 원하지 않으면 가입하지 않거나 언제든 탈퇴할 수 있어요. 이 처리 없이는 서비스를 제공할 수 없어요."),
        ...(process.env.PRIVACY_CONTACT ? [t("개인정보 문의: {contact}", { contact: process.env.PRIVACY_CONTACT })] : []),
      ],
    },
    {
      id: "translation",
      icon: "translate",
      title: t("번역 · AI"),
      lines: [
        t("글 번역은 외부 번역 서비스를 거쳐요. 같은 글을 다시 번역하지 않도록 결과를 저장해요."),
        t("한국어와 영어 밖의 화면 언어는 기계 번역이라 원어민 검수를 거치는 중이에요."),
        t("해결된 글의 AI 요약과 글쓰기 AI 점검은 글 내용을 NVIDIA의 AI API로 보내요. 보내기 전에 전화번호·등록번호·이메일은 지우고, 같은 요약을 다시 만들지 않도록 결과를 저장해요."),
        t("AI는 이웃 대신 답하지 않아요. 이웃들이 쓴 답을 정리하고, 질문을 더 잘 쓰도록 돕기만 해요."),
        t("글을 올리면 AI가 한 번 읽고 비자 종류·지역과 긴급·위기 신호를 분류해요. 위기 신호가 보이면 상담 번호를 글쓴이에게만 보여 주고 운영자가 먼저 살펴봐요. 글을 가리거나 막지는 않아요."),
      ],
    },
  ];
  return (
    <div className="mx-auto max-w-3xl lg:ml-2 pb-8">
      <PageHead line={7} title={t("운영 정책")} desc={t("가입할 때 동의하는 규칙이에요. 공개 정보, 신고와 재심, 탈퇴 후 데이터를 한곳에 모았어요.")} />
      <nav aria-label={t("운영 정책")} className="flex flex-wrap gap-1.5 px-4 pt-4">
        {sections.map((s) => (
          <FilterChip key={s.id} href={`#${s.id}`} label={s.title} on={false} />
        ))}
      </nav>
      <div className="space-y-3 px-4 py-4">
        {sections.map((s) => (
          <Card key={s.id} id={s.id} className="scroll-mt-20">
            <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
              <span className="flex size-8 items-center justify-center rounded-xl bg-soft text-primary">
                <Icon name={s.icon} size={17} />
              </span>
              {s.title}
            </h2>
            <ul className="mt-3 space-y-2 text-[15px] leading-relaxed">
              {s.lines.map((l) => (
                <li key={l} className="flex gap-2">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {l}
                </li>
              ))}
            </ul>
          </Card>
        ))}
        <p className="px-1 text-sm text-[var(--color-text-secondary)]">
          {t("긴급한 위험은 112(경찰)·119(구급), 체류·비자 문의는 1345로 바로 연락하세요.")}{" "}
          <Link href="/guide" className="font-bold text-primary underline">
            {t("공식 안내")}
          </Link>
        </p>
      </div>
    </div>
  );
}
