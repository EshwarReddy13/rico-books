"use client";

import { CurrencyProvider } from "@/components/dashboard/currency-context";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import type { NavUser } from "@/lib/dashboard/nav-user";

export function DashboardShell({
  user,
  children,
}: {
  user?: NavUser | null;
  children: React.ReactNode;
}) {
  return (
    <CurrencyProvider>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex min-h-0 w-full max-w-full flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto">
          <DashboardHeader user={user} />
          {children}
        </main>
      </div>
    </CurrencyProvider>
  );
}
