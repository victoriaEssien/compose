import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Skeleton className="h-8 w-48" />
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((at) => (
          <Skeleton key={at} className="aspect-[4/5] w-full rounded-lg" />
        ))}
      </div>
    </main>
  );
}
