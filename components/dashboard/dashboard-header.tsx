"use client";

import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";

import { CurrencyToggle } from "@/components/dashboard/currency-toggle";
import {
  getNavUserDisplayName,
  getNavUserInitials,
  type NavUser,
} from "@/lib/dashboard/nav-user";
import { getPageHeader } from "@/lib/dashboard/page-headers";

export function DashboardHeader({ user }: { user?: NavUser | null }) {
  const pathname = usePathname();
  const { title, subtitle } = getPageHeader(pathname);
  const displayName = getNavUserDisplayName(user);
  const initials = getNavUserInitials(user);

  return (
    <header className="flex min-w-0 w-full max-w-full flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 sm:text-base">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <CurrencyToggle />

        <label className="relative min-w-0 flex-1 sm:w-64 lg:w-80">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search"
            className="h-11 w-full rounded-full border-0 bg-white py-2 pr-4 pl-10 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-violet-300"
          />
        </label>

        <button
          type="button"
          className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-rose-400 ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2 rounded-full bg-white py-1.5 pr-3 pl-1.5 shadow-sm">
          {user?.image ? (
            <img
              src={user.image}
              alt=""
              className="size-9 rounded-full object-cover"
            />
          ) : (
            <span
              className="flex size-9 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700"
              aria-hidden
            >
              {initials}
            </span>
          )}
          <span className="hidden text-sm font-medium text-zinc-900 sm:inline">
            {displayName.includes(" ")
              ? `${displayName.split(" ")[0]} ${displayName.split(" ")[1]?.[0] ?? ""}.`.trim()
              : displayName}
          </span>
        </div>
      </div>
    </header>
  );
}
