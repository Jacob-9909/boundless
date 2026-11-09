import { notFound } from "next/navigation";
import { updatePost } from "@/app/actions";
import { WriteForm } from "@/components/forms";
import { BackLink, SignInRequired } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { boardOf } from "@/lib/boards";
import { countryName, langName, POST_LANGS } from "@/lib/i18n";
import { getPost, postImages } from "@/lib/posts";

export const metadata = { title: "Edit" };

export default async function EditPage(props: PageProps<"/posts/[id]/edit">) {
  const { id } = await props.params;
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  if (!user) return <SignInRequired t={t} next={`/posts/${id}/edit`} />;
  const [post, images] = await Promise.all([getPost(user.id, id), postImages(id)]);
  if (!post || !post.mine) notFound();
  const lounge = post.space !== "global";
  return (
    <div className="mx-auto max-w-3xl lg:ml-2 pb-6">
      <BackLink href={`/posts/${post.id}`} label={t("뒤로")} />
      <WriteForm
        action={updatePost.bind(null, post.id)}
        submitLabel={t("저장")}
        board={boardOf(post.topic)}
        space={lounge ? "lounge" : "global"}
        initial={{
          title: post.title,
          body: post.body,
          kind: post.kind,
          lang: post.lang,
          region: post.region ?? "",
          price: post.price === null ? "" : String(post.price),
          place: post.place ?? "",
          starts_on: post.starts_on ?? "",
          ends_on: post.ends_on ?? "",
        }}
        langs={POST_LANGS.map((code) => ({ code, name: langName(code, lang) }))}
        nationality={user.nationality}
        countryLabel={countryName(user.nationality, lang)}
        images={images}
      />
    </div>
  );
}
