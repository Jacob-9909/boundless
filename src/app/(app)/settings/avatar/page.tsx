import { AvatarBuilder } from "@/components/AvatarBuilder";
import { BackLink, PageHead, SignInRequired } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { parseLook } from "@/lib/avatar";
import { cultureOf } from "@/lib/cultures";

export const metadata = { title: "Avatar" };

export default async function AvatarPage() {
  const [{ t }, user] = await Promise.all([getT(), getUser()]);
  if (!user) return <SignInRequired t={t} next="/settings/avatar" />;
  return (
    <div className="mx-auto max-w-3xl pb-8 lg:ml-2">
      <BackLink href="/settings" label={t("설정")} />
      <PageHead line="ME · AVATAR" title={t("내 아바타")} desc={t("사람이나 동물 캐릭터를 골라요. 사람은 사진으로 피부색과 머리색을 채울 수도 있어요.")} />
      <AvatarBuilder initial={parseLook(user.avatar)} shown={user.avatar_public} soft={cultureOf(user.nationality).c.soft} />
    </div>
  );
}
