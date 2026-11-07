import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginScreen } from "@/components/LoginScreen";
import { getT, getUser } from "@/lib/auth";
import { cultureFromLanguages, cultureOf } from "@/lib/cultures";
import { sortedCountries } from "@/lib/i18n";
import { cultureFonts } from "./fonts";

export const metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const raw = typeof sp.next === "string" ? sp.next : "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  const [{ lang }, user] = await Promise.all([getT(), getUser()]);
  if (user) redirect(next);

  // Last culture picked on this device, else a guess from the browser's languages.
  const saved = (await cookies()).get("culture")?.value;
  const accept = ((await headers()).get("accept-language") ?? "").split(",").map((s) => s.split(";")[0].trim());
  const initial = saved ? cultureOf(saved).code : (cultureFromLanguages(accept)?.code ?? "XX");

  return (
    <div className={cultureFonts}>
      <LoginScreen lang={lang} initial={initial} next={next} countries={sortedCountries(lang)} />
    </div>
  );
}
