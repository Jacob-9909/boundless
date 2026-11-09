import { getUser } from "@/lib/auth";
import { isId, q } from "@/lib/db";

/** A post's photo, under the same rules as the post: never once hidden, lounge photos only for that nationality. */
export async function GET(_req: Request, ctx: RouteContext<"/api/img/[id]">) {
  const { id } = await ctx.params;
  if (!isId(id)) return new Response(null, { status: 404 });
  const rows = await q<{ mime: string; data: Buffer; space: string; hidden: boolean }>(
    "SELECT i.mime, i.data, p.space, p.hidden FROM boundless.post_images i JOIN boundless.posts p ON p.id = i.post_id WHERE i.id = $1",
    [id]
  );
  const img = rows[0];
  if (!img || img.hidden || (img.space !== "global" && img.space !== (await getUser())?.nationality)) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      // Private: a photo hidden by moderators must not live on in a shared cache. Ids never change content.
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
