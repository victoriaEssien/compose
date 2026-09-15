import { ResetForm } from "./reset-form";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="w-full max-w-sm">
      <ResetForm token={token ?? null} />
    </div>
  );
}
