import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";

import { ReportCard, ReportCardHeader } from "@/components/reports/report-card";
import { formatInrFromPaise } from "@/lib/dashboard/currency";
import type { EntityActivity } from "@/lib/metrics/types";
import { cn } from "@/lib/utils";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const avatarClasses = [
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-emerald-100 text-emerald-700",
] as const;

export function ReportsTopEntitiesCard({
  entities,
}: {
  entities: EntityActivity[];
}) {
  return (
    <ReportCard className="flex h-full flex-col">
      <ReportCardHeader
        title="Top entities"
        action={
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
          >
            See all
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        }
      />

      {entities.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No P&L activity this FY.
        </p>
      ) : (
        <ul className="space-y-1">
          {entities.map((entity, i) => (
            <li key={entity.entityId ?? entity.entityName}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl px-1 py-2.5 text-left transition hover:bg-zinc-50"
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    avatarClasses[i % avatarClasses.length],
                  )}
                  aria-hidden
                >
                  {initialsFromName(entity.entityName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-zinc-950">
                    {entity.entityName}
                  </span>
                  <span className="block text-xs text-zinc-500">
                    {entity.transactionCount} line
                    {entity.transactionCount === 1 ? "" : "s"} ·{" "}
                    {formatInrFromPaise(entity.amountPaise)}
                  </span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-zinc-400"
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </ReportCard>
  );
}
