import { createPost } from "@/app/actions";
import { WriteForm } from "@/components/forms";
import { BackLink, PageHead, SignInRequired } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { cultureOf } from "@/lib/cultures";
import { countryName, isTopic, langName, POST_LANGS } from "@/lib/i18n";

export const metadata = { title: "Write" };

export default async function WritePage(props: PageProps<"/write">) {
  const sp = await props.searchParams;
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  if (!user) return <SignInRequired t={t} next={`/write?${new URLSearchParams(sp as Record<string, string>)}`} />;
  const guess = cultureOf(user.nationality).langs[0]?.split("-")[0] ?? "";
  const initial = {
    title: String(sp.title ?? "").slice(0, 120),
    topic: isTopic(String(sp.topic ?? "")) ? String(sp.topic) : "",
    kind: sp.kind === "experience" ? "experience" : "question",
    region: user.region ?? "",
    lang: POST_LANGS.includes(guess) ? guess : "en",
  };
  return (
    <div className="mx-auto max-w-3xl pb-6">
      <BackLink href="/feed" label={t("뒤로")} />
      <PageHead line="LINE 03 · WRITE" title={t("글쓰기")} desc={t("답하는 사람에게 필요한 상황만 적어 주세요.")} />
      <WriteForm
        action={createPost}
        submitLabel={t("올리기")}
        initial={initial}
        lang={lang}
        langs={POST_LANGS.map((code) => ({ code, name: langName(code, lang) }))}
        nationality={user.nationality}
        countryLabel={countryName(user.nationality, lang)}
      />
    </div>
  );
}
