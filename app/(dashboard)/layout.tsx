import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SideNav } from "@/components/dashboard/side-nav";
import { auth } from "@/lib/auth/server";
import { toNavUser } from "@/lib/dashboard/nav-user";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = await auth.getSession();

  // Shell inset: window edges (p-*) + nav ↔ main gap (gap-*) — tune on the div below
  return (
    <div className="flex h-dvh w-full max-w-full gap-3 overflow-hidden p-3 text-foreground sm:gap-4 sm:pl-2 sm:pr-10 sm:pt-2 sm:pb-2">
      <SideNav />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardShell user={toNavUser(session?.user)}>
          {children}
        </DashboardShell>
      </div>
    </div>
  );
}
