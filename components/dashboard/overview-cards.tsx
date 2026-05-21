"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  MoreHorizontal,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { OverviewTransactionsDialog } from "@/components/dashboard/overview-transactions-dialog";
import { useCurrency } from "@/components/dashboard/currency-context";
import { formatAmount } from "@/lib/dashboard/currency";
import type { OverviewCardKind } from "@/lib/metrics/overview-transaction-filter";
import { fetchDashboardOverview } from "@/lib/metrics/metrics-api";
import {
  OVERVIEW_CUSTOM_RANGE_STORAGE_KEY,
  OVERVIEW_PERIOD_PRESETS,
  OVERVIEW_PERIOD_STORAGE_KEY,
  readStoredCustomRange,
  readStoredOverviewPeriod,
  type OverviewCustomRange,
  type OverviewPeriodPreset,
} from "@/lib/metrics/overview-period";
import type { DashboardOverviewMetrics, TrendMetric } from "@/lib/metrics/types";
import { cn } from "@/lib/utils";

const cardMeta: {
  key: OverviewCardKind;
  label: string;
  icon: LucideIcon;
  className: string;
  decorClassName: string;
  iconClassName: string;
  amount: (o: DashboardOverviewMetrics) => number;
  trend: (o: DashboardOverviewMetrics) => TrendMetric;
}[] = [
  {
    key: "profit",
    label: "Profit",
    icon: TrendingUp,
    className: "bg-[#e5f5ee]",
    decorClassName: "bg-emerald-300/40",
    iconClassName: "text-emerald-700",
    amount: (o: DashboardOverviewMetrics) => o.profitPaise,
    trend: (o: DashboardOverviewMetrics) => o.profitTrend,
  },
  {
    key: "income" as const,
    label: "Income",
    icon: ArrowDownLeft,
    className: "bg-[#e3f0fa]",
    decorClassName: "bg-sky-300/40",
    iconClassName: "text-sky-700",
    amount: (o: DashboardOverviewMetrics) => o.incomePaise,
    trend: (o: DashboardOverviewMetrics) => o.incomeTrend,
  },
  {
    key: "expense" as const,
    label: "Expenses",
    icon: ArrowUpRight,
    className: "bg-[#fce8ea]",
    decorClassName: "bg-rose-300/40",
    iconClassName: "text-rose-700",
    amount: (o: DashboardOverviewMetrics) => o.expensePaise,
    trend: (o: DashboardOverviewMetrics) => o.expenseTrend,
  },
] as const;

function defaultCustomRange(): OverviewCustomRange {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const startDate = new Date(now);
  startDate.setUTCMonth(startDate.getUTCMonth() - 1);
  const start = startDate.toISOString().slice(0, 10);
  return { start, end };
}

export function OverviewCards({ entityId }: { entityId: string | null }) {
  const { currency } = useCurrency();
  const [preset, setPreset] = useState<OverviewPeriodPreset>("month");
  const [customRange, setCustomRange] = useState<OverviewCustomRange>(
    defaultCustomRange,
  );
  const [metrics, setMetrics] = useState<DashboardOverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [customError, setCustomError] = useState<string | null>(null);
  const [drillDown, setDrillDown] = useState<OverviewCardKind | null>(null);

  const loadOverview = useCallback(
    async (
      period: OverviewPeriodPreset,
      custom?: OverviewCustomRange | null,
    ) => {
      setLoading(true);
      setCustomError(null);
      try {
        const data = await fetchDashboardOverview(
          entityId,
          period,
          period === "custom" ? custom : undefined,
        );
        setMetrics(data);
      } catch (err) {
        setMetrics(null);
        if (period === "custom") {
          setCustomError(
            err instanceof Error ? err.message : "Invalid custom range",
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [entityId],
  );

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedPreset = readStoredOverviewPeriod();
    const storedCustom = readStoredCustomRange() ?? defaultCustomRange();
    setPreset(storedPreset);
    setCustomRange(storedCustom);
    setHydrated(true);
    if (storedPreset === "custom") {
      void loadOverview("custom", storedCustom);
    } else {
      void loadOverview(storedPreset);
    }
  }, [entityId, loadOverview]);

  useEffect(() => {
    if (!hydrated || preset === "custom") {
      return;
    }
    void loadOverview(preset);
  }, [hydrated, entityId, preset, loadOverview]);

  function selectPreset(next: OverviewPeriodPreset) {
    setPreset(next);
    window.localStorage.setItem(OVERVIEW_PERIOD_STORAGE_KEY, next);
    setCustomError(null);
  }

  function applyCustomRange() {
    window.localStorage.setItem(
      OVERVIEW_CUSTOM_RANGE_STORAGE_KEY,
      JSON.stringify(customRange),
    );
    void loadOverview("custom", customRange);
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {cardMeta.map((meta) => (
          <OverviewCard
            key={meta.key}
            label={meta.label}
            icon={meta.icon}
            className={meta.className}
            decorClassName={meta.decorClassName}
            iconClassName={meta.iconClassName}
            amountPaise={
              metrics && !loading ? meta.amount(metrics) : null
            }
            trendLabel={
              metrics && !loading ? meta.trend(metrics).trend : "—"
            }
            trendUp={
              metrics && !loading ? meta.trend(metrics).trendUp : true
            }
            compareLabel={metrics?.compareLabel ?? "vs prior period"}
            dateRangeLabel={metrics?.dateRangeLabel ?? ""}
            preset={preset}
            onSelectPreset={selectPreset}
            onOpenTransactions={() => setDrillDown(meta.key)}
            currency={currency}
            loading={loading}
          />
        ))}
      </div>

      {drillDown ? (
        <OverviewTransactionsDialog
          kind={drillDown}
          entityId={entityId}
          period={preset}
          customRange={preset === "custom" ? customRange : null}
          onClose={() => setDrillDown(null)}
        />
      ) : null}

      {preset === "custom" ? (
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl">
          <p className="text-sm font-medium text-zinc-800">Custom date range</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              From
              <input
                type="date"
                value={customRange.start}
                onChange={(e) =>
                  setCustomRange((r) => ({ ...r, start: e.target.value }))
                }
                className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              To
              <input
                type="date"
                value={customRange.end}
                onChange={(e) =>
                  setCustomRange((r) => ({ ...r, end: e.target.value }))
                }
                className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-900"
              />
            </label>
            <button
              type="button"
              onClick={applyCustomRange}
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Apply
            </button>
          </div>
          {customError ? (
            <p className="mt-2 text-xs text-rose-600">{customError}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function OverviewCard({
  label,
  icon: Icon,
  className,
  decorClassName,
  iconClassName,
  amountPaise,
  trendLabel,
  trendUp,
  compareLabel,
  dateRangeLabel,
  preset,
  onSelectPreset,
  onOpenTransactions,
  currency,
  loading,
}: {
  label: string;
  icon: LucideIcon;
  className: string;
  decorClassName: string;
  iconClassName: string;
  amountPaise: number | null;
  trendLabel: string;
  trendUp: boolean;
  compareLabel: string;
  dateRangeLabel: string;
  preset: OverviewPeriodPreset;
  onSelectPreset: (preset: OverviewPeriodPreset) => void;
  onOpenTransactions: () => void;
  currency: ReturnType<typeof useCurrency>["currency"];
  loading: boolean;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpenTransactions}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenTransactions();
        }
      }}
      className={cn(
        "relative flex cursor-pointer flex-col overflow-hidden rounded-2xl p-4 transition hover:ring-2 hover:ring-zinc-900/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 sm:rounded-3xl sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-full bg-white/70",
            iconClassName,
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <button
          type="button"
          className="rounded-full p-1 text-zinc-500 transition hover:bg-white/50"
          aria-label={`${label} options`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <p className="mt-6 text-sm text-zinc-600">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl",
          loading && "animate-pulse text-zinc-400",
        )}
      >
        {loading ? "…" : amountPaise != null ? formatAmount(amountPaise, currency) : "—"}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-medium",
          trendUp ? "text-emerald-600" : "text-rose-500",
        )}
      >
        {trendLabel}
        <span className="ml-1 text-xs font-normal text-zinc-500">
          {compareLabel}
        </span>
      </p>

      <div
        className="relative z-10 mt-4 border-t border-black/5 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label={`${label} period`}
        >
          {OVERVIEW_PERIOD_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.fullLabel}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPreset(p.id);
              }}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium transition sm:text-xs",
                preset === p.id
                  ? "bg-white/90 text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:bg-white/50 hover:text-zinc-900",
              )}
            >
              {p.shortLabel}
            </button>
          ))}
        </div>
        {dateRangeLabel ? (
          <p className="mt-1.5 text-[10px] text-zinc-600 sm:text-xs">
            {dateRangeLabel}
          </p>
        ) : null}
        <p className="mt-1 text-[10px] font-medium text-zinc-500">
          Click card to view lines
        </p>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute -right-4 -bottom-6 size-24 rounded-full blur-sm sm:size-28",
          decorClassName,
        )}
        aria-hidden
      />
    </article>
  );
}
