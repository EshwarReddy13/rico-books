import { ChevronDown, Globe, Hexagon, User } from "lucide-react";

const transactions = [
  {
    name: "Stoneblack",
    description: "Payment for goods",
    amount: "-$23",
    negative: true,
    icon: Hexagon,
    iconClassName: "bg-violet-100 text-violet-600",
  },
  {
    name: "WorldTok",
    description: "Shares",
    amount: "+$45",
    negative: false,
    icon: Globe,
    iconClassName: "bg-sky-100 text-sky-600",
  },
  {
    name: "Niko",
    description: "Transfer",
    amount: "+$30",
    negative: false,
    icon: User,
    iconClassName: "bg-amber-100 text-amber-700",
  },
] as const;

export function TransactionsSection() {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-zinc-950">Transactions</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 sm:text-sm"
          >
            Period
            <ChevronDown className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 sm:text-sm"
          >
            Card or account
            <ChevronDown className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>

      <p className="mt-5 text-sm font-medium text-zinc-500">Today</p>
      <ul className="mt-3 space-y-1">
        {transactions.map(
          ({ name, description, amount, negative, icon: Icon, iconClassName }) => (
            <li key={name}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition hover:bg-zinc-50"
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full ${iconClassName}`}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-zinc-950">
                    {name}
                  </span>
                  <span className="block truncate text-xs text-zinc-500">
                    {description}
                  </span>
                </span>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    negative ? "text-zinc-950" : "text-emerald-600"
                  }`}
                >
                  {amount}
                </span>
              </button>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
