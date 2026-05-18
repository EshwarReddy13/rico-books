"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/auth/brand-mark";
import { NavEntitySelector } from "@/components/dashboard/nav-entity-selector";
import { NavThemeToggle } from "@/components/dashboard/nav-theme-toggle";
import type { EntitySummary } from "@/lib/entities/types";
import {
  dashboardBooksNavItems,
  dashboardMainNavItems,
  dashboardSettingsNavItem,
  type DashboardNavItem,
} from "@/lib/dashboard/nav-items";
import { cn } from "@/lib/utils";

function isNavActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon: Icon,
  variant = "main",
}: DashboardNavItem & { variant?: "main" | "settings" }) {
  const pathname = usePathname();
  const active = isNavActive(pathname, href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-center gap-3 rounded-xl px-2 py-2.5 transition-colors",
        "sm:justify-start sm:px-3",
        active
          ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
          : "text-zinc-950 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
      )}
      aria-current={active ? "page" : undefined}
      title={label}
    >
      <Icon
        className={cn(
          "size-5 shrink-0",
          active
            ? "text-white dark:text-zinc-950"
            : "text-zinc-600 dark:text-zinc-400",
        )}
        aria-hidden
      />
      <span
        className={cn(
          "hidden truncate text-sm font-medium sm:inline",
          active ? "text-white dark:text-zinc-950" : "text-inherit",
        )}
      >
        {label}
      </span>
    </Link>
  );
}

export function SideNav({ entities }: { entities: EntitySummary[] }) {
  return (
    <aside className="flex h-full w-[5rem] shrink-0 flex-col sm:w-56">
      <nav
        className={cn(
          "flex h-full min-h-0 flex-col gap-1 rounded-2xl border border-neutral-200/80 bg-white p-2",
          "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]",
          "dark:border-zinc-800 dark:bg-zinc-900",
          "sm:gap-1.5 sm:rounded-3xl sm:p-3",
        )}
        aria-label="Main"
      >
        <Link
          href="/"
          className="mb-2 flex items-center justify-center gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 sm:justify-start sm:px-1"
        >
          <BrandMark className="size-8 shrink-0 sm:size-9" />
          <span className="hidden text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:inline">
            Rico Books
          </span>
        </Link>

        <div className="mb-2 border-b border-neutral-100 pb-3 dark:border-zinc-800">
          <NavEntitySelector entities={entities} />
        </div>

        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {dashboardMainNavItems.map((item) => (
            <li key={item.href}>
              <NavLink {...item} variant="main" />
            </li>
          ))}

          <li
            className="my-2 border-t border-neutral-100 dark:border-zinc-800"
            aria-hidden
          />

          <li className="hidden px-3 pb-1 sm:list-item">
            <span className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
              Books
            </span>
          </li>

          {dashboardBooksNavItems.map((item) => (
            <li key={item.href}>
              <NavLink {...item} variant="main" />
            </li>
          ))}
        </ul>

        <div className="mt-auto shrink-0 space-y-1 border-t border-neutral-100 pt-2 dark:border-zinc-800">
          <NavLink {...dashboardSettingsNavItem} variant="settings" />
          <NavThemeToggle />
        </div>
      </nav>
    </aside>
  );
}
