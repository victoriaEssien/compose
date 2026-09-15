import { redirect } from "next/navigation";

import { currentUserId } from "@/server/auth";
import { SignInForm } from "./sign-in-form";

export default async function Page() {
  if (await currentUserId()) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-10">
      <SignInForm />
    </main>
  );
}
