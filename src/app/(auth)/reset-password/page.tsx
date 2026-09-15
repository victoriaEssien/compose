import { ResetForm } from "./reset-form";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-10">
      <ResetForm token={token ?? null} />
    </main>
  );
}
