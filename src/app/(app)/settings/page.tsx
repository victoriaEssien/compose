import { PageHeader } from "@/components/page-header";
import { listAssets } from "@/server/assets";
import { requireUser } from "@/server/auth";
import { Appearance } from "./appearance";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";
import { Sessions } from "./sessions";

export const metadata = { title: "Account settings" };

const joined = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });

export default async function Page() {
  const user = await requireUser();
  const assets = await listAssets(user.id);

  return (
    <>
      <PageHeader
        title="Account settings"
        description="You and your sign-in. Everything about how your posts look lives in the Brand Kit."
      />

      <div className="mt-8 grid gap-5">
        <ProfileForm
          assets={assets}
          initial={{ name: user.name, email: user.email, image: user.image ?? null }}
        />
        <PasswordForm />
        <Appearance />
        <Sessions memberSince={joined.format(new Date(user.createdAt))} />
      </div>
    </>
  );
}
