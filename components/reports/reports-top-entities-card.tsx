import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";

import { ReportCard, ReportCardHeader } from "@/components/reports/report-card";
import { cn } from "@/lib/utils";

const entities = [
  {
    name: "Acme Corp",
    subtitle: "12 transactions",
    avatar: "AC",
    avatarClass: "bg-sky-100 text-sky-700",
  },
  {
    name: "HDFC Bank",
    subtitle: "Salary & transfers",
    avatar: "HB",
    avatarClass: "bg-violet-100 text-violet-700",
  },
  {
    name: "Amazon India",
    subtitle: "8 transactions",
    avatar: "AI",
    avatarClass: "bg-amber-100 text-amber-800",
  },
] as const;

export function ReportsTopEntitiesCard() {
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

      <ul className="space-y-1">
        {entities.map((entity) => (
          <li key={entity.name}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl px-1 py-2.5 text-left transition hover:bg-zinc-50"
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  entity.avatarClass,
                )}
                aria-hidden
              >
                {entity.avatar}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-zinc-950">
                  {entity.name}
                </span>
                <span className="block text-xs text-zinc-500">
                  {entity.subtitle}
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
    </ReportCard>
  );
}
