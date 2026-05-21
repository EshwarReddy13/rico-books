/** Presets for dashboard overview cards (Profit / Income / Expenses). */
export type OverviewPeriodPreset =
  | "week"
  | "month"
  | "3m"
  | "6m"
  | "fy"
  | "custom";

export const OVERVIEW_PERIOD_PRESETS: {
  id: OverviewPeriodPreset;
  shortLabel: string;
  fullLabel: string;
}[] = [
  { id: "week", shortLabel: "Week", fullLabel: "Last 7 days" },
  { id: "month", shortLabel: "Month", fullLabel: "This month" },
  { id: "3m", shortLabel: "3 mo", fullLabel: "Last 3 months" },
  { id: "6m", shortLabel: "6 mo", fullLabel: "Last 6 months" },
  {
    id: "fy",
    shortLabel: "FY",
    fullLabel: "Financial year (Apr – Mar)",
  },
  { id: "custom", shortLabel: "Custom", fullLabel: "Custom range" },
];

export const OVERVIEW_PERIOD_STORAGE_KEY = "rico-books-overview-period";
export const OVERVIEW_CUSTOM_RANGE_STORAGE_KEY =
  "rico-books-overview-custom-range";

export type OverviewCustomRange = {
  start: string;
  end: string;
};

export type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

function utcDate(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d));
}

function startOfTodayUtc(now: Date): Date {
  return utcDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function fiscalYearStart(year: number): Date {
  return utcDate(year, 3, 1);
}

function calendarMonthStart(year: number, month: number): Date {
  return utcDate(year, month, 1);
}

function currentFyStartYear(now: Date): number {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return m >= 3 ? y : y - 1;
}

function parseIsoDateOnly(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) {
    return null;
  }
  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const d = Number(match[3]);
  if (m < 0 || m > 11 || d < 1 || d > 31) {
    return null;
  }
  return utcDate(y, m, d);
}

export function resolveOverviewPeriodRange(
  preset: OverviewPeriodPreset,
  now: Date = new Date(),
  custom?: OverviewCustomRange | null,
): DateRange | { error: string } {
  const end = startOfTodayUtc(now);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();

  switch (preset) {
    case "week": {
      const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
      return { start, end: now, label: "Week" };
    }
    case "month":
      return {
        start: calendarMonthStart(y, m),
        end: now,
        label: "Month",
      };
    case "3m": {
      const startM = m - 2;
      const startY = startM < 0 ? y - 1 : y;
      const normM = ((startM % 12) + 12) % 12;
      return {
        start: calendarMonthStart(startY, normM),
        end: now,
        label: "3 months",
      };
    }
    case "6m": {
      const startM = m - 5;
      const startY = startM < 0 ? y - 1 : y;
      const normM = ((startM % 12) + 12) % 12;
      return {
        start: calendarMonthStart(startY, normM),
        end: now,
        label: "6 months",
      };
    }
    case "fy": {
      const fyStartYear = currentFyStartYear(now);
      return {
        start: fiscalYearStart(fyStartYear),
        end: now,
        label: "FY",
      };
    }
    case "custom": {
      if (!custom?.start || !custom?.end) {
        return { error: "Choose a start and end date." };
      }
      const start = parseIsoDateOnly(custom.start);
      const endParsed = parseIsoDateOnly(custom.end);
      if (!start || !endParsed) {
        return { error: "Invalid date format." };
      }
      const customEnd = endParsed > now ? now : endParsed;
      if (start > customEnd) {
        return { error: "Start date must be on or before end date." };
      }
      return {
        start,
        end: customEnd,
        label: "Custom",
      };
    }
    default:
      return resolveOverviewPeriodRange("month", now, custom);
  }
}

/** Previous period of equal length ending the day before `start`. */
export function previousComparableRange(range: DateRange): DateRange {
  const ms =
    range.end.getTime() - range.start.getTime() + 24 * 60 * 60 * 1000;
  const prevEnd = new Date(range.start.getTime() - 24 * 60 * 60 * 1000);
  const prevStart = new Date(prevEnd.getTime() - ms + 24 * 60 * 60 * 1000);
  return {
    start: prevStart,
    end: prevEnd,
    label: `Prior ${range.label}`,
  };
}

export function formatOverviewDateRange(range: DateRange): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  };
  const startStr = range.start.toLocaleDateString("en-IN", opts);
  const endStr = range.end.toLocaleDateString("en-IN", opts);
  if (startStr === endStr) {
    return startStr;
  }
  return `${startStr} – ${endStr}`;
}

export function comparePeriodHint(preset: OverviewPeriodPreset): string {
  switch (preset) {
    case "week":
      return "vs prior week";
    case "month":
      return "vs prior month";
    case "3m":
      return "vs prior 3 months";
    case "6m":
      return "vs prior 6 months";
    case "fy":
      return "vs prior FY";
    case "custom":
      return "vs prior period";
    default:
      return "vs prior period";
  }
}

export function readStoredOverviewPeriod(): OverviewPeriodPreset {
  if (typeof window === "undefined") {
    return "month";
  }
  const stored = window.localStorage.getItem(OVERVIEW_PERIOD_STORAGE_KEY);
  if (
    stored &&
    OVERVIEW_PERIOD_PRESETS.some((p) => p.id === stored)
  ) {
    return stored as OverviewPeriodPreset;
  }
  return "month";
}

export function readStoredCustomRange(): OverviewCustomRange | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(OVERVIEW_CUSTOM_RANGE_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as OverviewCustomRange;
    if (parsed?.start && parsed?.end) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}
