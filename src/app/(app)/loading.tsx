import { getT } from "@/lib/auth";

/** Shown at once while a page's data loads, so a tap never looks ignored. */
export default async function Loading() {
  const { t } = await getT();
  return (
    <div className="space-y-4 px-4 py-4 md:px-6 md:py-6" aria-busy="true">
      <p role="status" className="sr-only">
        {t("불러오는 중…")}
      </p>
      <div className="h-36 animate-pulse rounded-3xl bg-ink/[.06]" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-ink/[.05]">
          <div className="flex items-center gap-3">
            <div className="size-10 animate-pulse rounded-full bg-ink/[.07]" />
            <div className="h-3 w-40 animate-pulse rounded-full bg-ink/[.07]" />
          </div>
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-ink/[.07]" />
          <div className="h-3 w-full animate-pulse rounded-full bg-ink/[.05]" />
        </div>
      ))}
    </div>
  );
}
