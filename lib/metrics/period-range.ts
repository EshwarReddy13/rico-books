import type { CategoryPeriod } from "@/lib/categories/types";

export type MetricsPeriod = CategoryPeriod | "Last FY" | "Last 6 months";

export type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

/** Indian FY: 1 Apr – 31 Mar */
function fiscalYearStart(year: number): Date {
  return new Date(Date.UTC(year, 3, 1));
}

function fiscalYearEnd(year: number): Date {
  return new Date(Date.UTC(year + 1, 2, 31));
}

function calendarMonthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1));
}

function calendarMonthEnd(year: number, month: number): Date {
  return new Date(Date.UTC(year, month + 1, 0));
}

function currentFyStartYear(now: Date): number {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return m >= 3 ? y : y - 1;
}

export function resolvePeriodRange(
  period: MetricsPeriod,
  now: Date = new Date(),
): DateRange {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const fyStartYear = currentFyStartYear(now);

  switch (period) {
    case "This FY":
      return {
        start: fiscalYearStart(fyStartYear),
        end: now,
        label: "This FY",
      };
    case "Last FY":
      return {
        start: fiscalYearStart(fyStartYear - 1),
        end: fiscalYearEnd(fyStartYear - 1),
        label: "Last FY",
      };
    case "This month":
      return {
        start: calendarMonthStart(y, m),
        end: now,
        label: "This month",
      };
    case "Last month": {
      const prevM = m === 0 ? 11 : m - 1;
      const prevY = m === 0 ? y - 1 : y;
      return {
        start: calendarMonthStart(prevY, prevM),
        end: calendarMonthEnd(prevY, prevM),
        label: "Last month",
      };
    }
    case "Last 6 months": {
      const startM = m - 5;
      const startY = startM < 0 ? y - 1 : y;
      const normM = ((startM % 12) + 12) % 12;
      return {
        start: calendarMonthStart(startY, normM),
        end: now,
        label: "Last 6 months",
      };
    }
    default:
      return resolvePeriodRange("This month", now);
  }
}

/** Previous period of equal length ending the day before `start`. */
export function previousComparableRange(range: DateRange): DateRange {
  const ms =
    range.end.getTime() -
    range.start.getTime() +
    24 * 60 * 60 * 1000;
  const prevEnd = new Date(range.start.getTime() - 24 * 60 * 60 * 1000);
  const prevStart = new Date(prevEnd.getTime() - ms + 24 * 60 * 60 * 1000);
  return {
    start: prevStart,
    end: prevEnd,
    label: `Prior ${range.label}`,
  };
}

export function monthBucketsInRange(range: DateRange): DateRange[] {
  const buckets: DateRange[] = [];
  let cursor = new Date(
    Date.UTC(range.start.getUTCFullYear(), range.start.getUTCMonth(), 1),
  );
  const end = range.end;

  while (cursor <= end) {
    const y = cursor.getUTCFullYear();
    const mo = cursor.getUTCMonth();
    const start = calendarMonthStart(y, mo);
    const monthEnd = calendarMonthEnd(y, mo);
    const bucketEnd = monthEnd > end ? end : monthEnd;
    buckets.push({
      start,
      end: bucketEnd,
      label: start.toLocaleDateString("en-IN", {
        month: "short",
        timeZone: "UTC",
      }),
    });
    cursor = calendarMonthStart(y, mo + 1);
  }

  return buckets.slice(-6);
}

export function formatTxnDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
