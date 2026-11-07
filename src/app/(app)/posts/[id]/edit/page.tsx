import { notFound } from "next/navigation";
import { updatePost } from "@/app/actions";
import { WriteForm } from "@/components/forms";
import { BackLink, PageHead, SignInRequired } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { countryName, langName, POST_LANGS } from "@/lib/i18n";
import { getPost } from "@/lib/posts";

export const metadata = { title: "Edit" };

export default async function EditPage(props: PageProps<"/posts/[id]/edit">) {
  const { id } = await props.params;
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  if (!user) return <SignInRequired t={t} next={`/posts/${id}/edit`} />;
  const post = await getPost(user.id, id);
  if (!post || !post.mine) notFound();
  return (
    <>
      <BackLink href={`/posts/${post.id}`} label={t("뒤로")} />
      <PageHead line="LINE 03 · EDIT" title={t("글 수정")} />
      <WriteForm
        action={updatePost.bind(null, post.id)}
        submitLabel={t("저장")}
        initial={{ title: post.title, body: post.body, topic: post.topic, kind: post.kind, lang: post.lang, region: post.region ?? "" }}
        lang={lang}
        langs={POST_LANGS.map((code) => ({ code, name: langName(code, lang) }))}
        nationality={user.nationality}
        countryLabel={countryName(user.nationality, lang)}
      />
    </>
  );
}
