export type MainCategoryCardStyle = {
  /** Selected — full color */
  card: string;
  /** Unselected — same hue, softer */
  cardMuted: string;
  /** Selected — slightly darker border (same hue as card) */
  border: string;
  kind: string;
  sub: string;
  /** Top-right dot */
  accent: string;
};

const stylesByName: Record<string, MainCategoryCardStyle> = {
  Income: {
    card: "bg-emerald-200 text-emerald-950",
    cardMuted: "bg-emerald-100/90 text-emerald-900/80",
    border: "border-emerald-500",
    kind: "text-emerald-800",
    sub: "text-emerald-800/75",
    accent: "bg-emerald-700",
  },
  Expense: {
    card: "bg-rose-200 text-rose-950",
    cardMuted: "bg-rose-100/90 text-rose-900/80",
    border: "border-rose-500",
    kind: "text-rose-800",
    sub: "text-rose-800/75",
    accent: "bg-rose-700",
  },
  "Owner Contribution": {
    card: "bg-sky-200 text-sky-950",
    cardMuted: "bg-sky-100/90 text-sky-900/80",
    border: "border-sky-500",
    kind: "text-sky-800",
    sub: "text-sky-800/75",
    accent: "bg-sky-700",
  },
  Assets: {
    card: "bg-violet-200 text-violet-950",
    cardMuted: "bg-violet-100/90 text-violet-900/80",
    border: "border-violet-500",
    kind: "text-violet-800",
    sub: "text-violet-800/75",
    accent: "bg-violet-700",
  },
  Loans: {
    card: "bg-amber-200 text-amber-950",
    cardMuted: "bg-amber-100/90 text-amber-900/80",
    border: "border-amber-600",
    kind: "text-amber-900",
    sub: "text-amber-900/75",
    accent: "bg-amber-700",
  },
  Transfer: {
    card: "bg-zinc-300 text-zinc-950",
    cardMuted: "bg-zinc-200/90 text-zinc-800/80",
    border: "border-zinc-500",
    kind: "text-zinc-800",
    sub: "text-zinc-800/75",
    accent: "bg-zinc-600",
  },
};

const defaultStyle: MainCategoryCardStyle = {
  card: "bg-zinc-200 text-zinc-950",
  cardMuted: "bg-zinc-100/90 text-zinc-700/80",
  border: "border-zinc-500",
  kind: "text-zinc-700",
  sub: "text-zinc-700/75",
  accent: "bg-zinc-600",
};

export function getMainCategoryCardStyle(name: string): MainCategoryCardStyle {
  return stylesByName[name] ?? defaultStyle;
}
