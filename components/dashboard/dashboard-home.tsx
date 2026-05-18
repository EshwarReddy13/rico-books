import { AnalyticsSection } from "@/components/dashboard/analytics-section";
import {
  ActionWidget,
  ExpensesMayWidget,
  FavoriteSpendsWidget,
} from "@/components/dashboard/dashboard-widgets";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { TransactionsSection } from "@/components/dashboard/transactions-section";

export function DashboardHome() {
  return (
    <>
      <div className="grid min-w-0 w-full max-w-full gap-4 xl:grid-cols-12 xl:gap-5">
        <div className="xl:col-span-7">
          <OverviewCards />
        </div>
        <div className="xl:col-span-5">
          <AnalyticsSection />
        </div>
      </div>

      <div className="grid min-w-0 w-full max-w-full gap-4 xl:grid-cols-12 xl:gap-5">
        <div className="xl:col-span-5">
          <TransactionsSection />
        </div>
        <div className="grid gap-4 xl:col-span-7">
          <ActionWidget />
          <div className="grid gap-4 sm:grid-cols-2">
            <ExpensesMayWidget />
            <FavoriteSpendsWidget />
          </div>
        </div>
      </div>
    </>
  );
}
