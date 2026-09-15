import { redirect } from "next/navigation";

import { currentUserId } from "@/server/auth";
import { SignInForm } from "./sign-in-form";

export default async function Page() {
  if (await currentUserId()) redirect("/dashboard");

  return (
    <div className="w-full max-w-sm">
      <SignInForm />
    </div>
  );
}
