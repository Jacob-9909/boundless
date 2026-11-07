import { blockAuthor } from "@/app/actions";
import { ReportForm } from "@/components/forms";
import { BackLink, PageHead, SignInRequired, card } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";

export const metadata = { title: "Report" };

export default async function ReportPage(props: PageProps<"/report">) {
  const sp = await props.searchParams;
  const post = typeof sp.post === "string" ? sp.post : undefined;
  const comment = typeof sp.comment === "string" ? sp.comment : undefined;
  const [{ t }, user] = await Promise.all([getT(), getUser()]);
  if (!user) return <SignInRequired t={t} next={`/report?${new URLSearchParams(sp as Record<string, string>)}`} />;

  return (
    <div className="mx-auto max-w-3xl pb-6">
      <BackLink href={post ? `/posts/${post}` : "/"} label={t("뒤로")} />
      <PageHead line="LINE 08 · REPORT" title={comment ? t("댓글 신고") : t("글 신고")} desc={t("신고 내용은 공개되지 않아요. 운영자가 검토해요.")} />
      <div className="space-y-4 p-4">
        <ReportForm post={post} comment={comment} />
        <form action={blockAuthor} className="rounded-2xl bg-soft/60 p-5">
          {post && <input type="hidden" name="post" value={post} />}
          {comment && <input type="hidden" name="comment" value={comment} />}
          <p className="font-bold">{t("이 계정의 글을 더 보고 싶지 않나요?")}</p>
          <p className="mt-1 text-xs opacity-70">{t("차단하면 그 계정의 글과 댓글이 내 화면에서 사라져요. 상대에게는 알리지 않아요.")}</p>
          <button className={`${card} mt-3 h-11 px-5 text-[15px] font-bold text-primary`}>{t("작성자 차단")}</button>
        </form>
      </div>
    </div>
  );
}
