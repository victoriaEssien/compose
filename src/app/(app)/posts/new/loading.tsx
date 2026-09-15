import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl">
      <Skeleton className="h-8 w-52" />
      <div className="mt-10 flex flex-col gap-6">
        <Skeleton className="h-52 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}
