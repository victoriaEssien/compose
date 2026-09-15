import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Skeleton className="h-8 w-40" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-6">
          {[0, 1, 2, 3].map((at) => (
            <Skeleton key={at} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="aspect-[4/5] w-full rounded-lg lg:w-[19rem]" />
      </div>
    </main>
  );
}
