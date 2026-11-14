import { Button } from "@astryxdesign/core/Button";
import { AvatarBuilder } from "@/components/AvatarBuilder";
import { Icon } from "@/components/Icon";
import { BackLink, PageHead, SignInRequired } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { parseLook } from "@/lib/avatar";
import { cultureOf } from "@/lib/cultures";

export const metadata = { title: "Avatar" };

export default async function AvatarPage(props: PageProps<"/settings/avatar">) {
  const sp = await props.searchParams;
  const [{ t }, user] = await Promise.all([getT(), getUser()]);
  if (!user) return <SignInRequired t={t} next="/settings/avatar" />;
  // Right after sign-up: a skippable first step, then on to where the person was going (same-site paths only).
  const welcome = sp.welcome === "1";
  const raw = String(sp.next ?? "");
  const next = raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : "/feed";
  return (
    <div className="mx-auto max-w-3xl pb-8 lg:ml-2">
      {!welcome && <BackLink href="/settings" label={t("설정")} />}
      <PageHead
        line="ME · AVATAR"
        title={welcome ? t("가입을 환영해요! 내 아바타를 만들어 보세요") : t("내 아바타")}
        desc={t("사람이나 동물 캐릭터를 골라요. 사람은 사진으로 피부색과 머리색을 채울 수도 있어요.")}
      >
        {welcome && (
          <Button href={next} label={t("나중에 할게요")} variant="secondary" endContent={<Icon name="next" size={16} />} className="mt-3" />
        )}
      </PageHead>
      <AvatarBuilder initial={parseLook(user.avatar)} shown={user.avatar_public} soft={cultureOf(user.nationality).c.soft} doneHref={welcome ? next : undefined} />
    </div>
  );
}
