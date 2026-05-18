import { SettingsPage } from "@/components/settings/settings-page";
import { auth } from "@/lib/auth/server";
import { toNavUser } from "@/lib/dashboard/nav-user";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { data: session } = await auth.getSession();

  return <SettingsPage user={toNavUser(session?.user)} />;
}
