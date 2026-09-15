import { Skeleton } from "@/components/ui/skeleton";

/**
 * The editor awaits every slide render before any markup appears, which is the
 * longest blocking navigation in the app. This is roughly its shape.
 */
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-5">
          <Skeleton className="h-16 w-64" />
          <Skeleton className="aspect-[4/5] w-full max-w-[440px] rounded-xl" />
          <Skeleton className="h-8 w-72" />
        </div>
        <div className="flex flex-col gap-6">
          {[0, 1, 2].map((at) => (
            <Skeleton key={at} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </main>
  );
}
