import { Card } from "@astryxdesign/core/Card";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { getT } from "@/lib/auth";

/** Shown at once while a page's data loads, so a tap never looks ignored. */
export default async function Loading() {
  const { t } = await getT();
  return (
    <div className="space-y-4 px-4 py-4 md:px-6 md:py-6" aria-busy="true">
      <p role="status" className="sr-only">
        {t("불러오는 중…")}
      </p>
      <Skeleton height={144} radius={4} />
      {[0, 1, 2].map((i) => (
        <Card key={i} className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton width={40} height={40} radius="rounded" index={i} />
            <Skeleton width={160} height={12} radius="rounded" index={i} />
          </div>
          <Skeleton width="75%" height={16} radius="rounded" index={i} />
          <Skeleton height={12} radius="rounded" index={i} />
        </Card>
      ))}
    </div>
  );
}
