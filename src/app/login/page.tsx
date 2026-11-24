import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginScreen } from "@/features/auth/LoginScreen";
import { demoEnabled, getT, getUser } from "@/features/auth/auth";
import { cultureFromLanguages, cultureOf } from "@/features/culture/cultures";
import { sortedCountries } from "@/features/i18n/i18n";
import { cultureFonts } from "./fonts";

export const metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const raw = typeof sp.next === "string" ? sp.next : "/feed";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/feed";
  const [{ lang }, user] = await Promise.all([getT(), getUser()]);
  if (user) redirect(next);

  // Last culture picked on this device, else a guess from the browser's languages.
  const saved = (await cookies()).get("culture")?.value;
  const accept = ((await headers()).get("accept-language") ?? "").split(",").map((s) => s.split(";")[0].trim());
  // A culture picked on the landing page wins, then this device's last pick, then the browser language.
  const pick = typeof sp.culture === "string" ? sp.culture : saved;
  const initial = pick ? cultureOf(pick).code : (cultureFromLanguages(accept)?.code ?? "XX");

  return (
    <div className={cultureFonts}>
      <LoginScreen lang={lang} initial={initial} next={next} countries={sortedCountries(lang)} demo={demoEnabled()} />
    </div>
  );
}
