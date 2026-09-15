import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-9 w-56" />
      <div className="mt-10 grid gap-5">
        {[0, 1, 2].map((at) => (
          <Skeleton key={at} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
