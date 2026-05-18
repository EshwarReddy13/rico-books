import { ReportsCategoryMixCard } from "@/components/reports/reports-category-mix-card";
import { ReportsMetricCards } from "@/components/reports/reports-metric-cards";
import { ReportsMonthlyFlowCard } from "@/components/reports/reports-monthly-flow-card";
import { ReportsProfitTrendCard } from "@/components/reports/reports-profit-trend-card";
import { ReportsRecentCard } from "@/components/reports/reports-recent-card";
import { ReportsSpendingDonutCard } from "@/components/reports/reports-spending-donut-card";
import { ReportsTopEntitiesCard } from "@/components/reports/reports-top-entities-card";

export function ReportsPage() {
  return (
    <div className="grid min-w-0 w-full max-w-full gap-4 xl:grid-cols-12 xl:gap-5">
      <div className="grid gap-4 xl:col-span-5">
        <ReportsMetricCards />
      </div>
      <div className="xl:col-span-7">
        <ReportsCategoryMixCard />
      </div>

      <div className="xl:col-span-4">
        <ReportsMonthlyFlowCard />
      </div>
      <div className="xl:col-span-8">
        <ReportsProfitTrendCard />
      </div>

      <div className="xl:col-span-4">
        <ReportsSpendingDonutCard />
      </div>
      <div className="xl:col-span-4">
        <ReportsRecentCard />
      </div>
      <div className="xl:col-span-4">
        <ReportsTopEntitiesCard />
      </div>
    </div>
  );
}
