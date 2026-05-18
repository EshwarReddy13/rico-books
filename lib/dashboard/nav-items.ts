import {
  BarChart3,
  Landmark,
  LayoutDashboard,
  Receipt,
  Scale,
  Settings,
  Tags,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Daily workflow — top of the nav */
export const dashboardMainNavItems: DashboardNavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

/** Chart of accounts & registers — below the divider */
export const dashboardBooksNavItems: DashboardNavItem[] = [
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/assets", label: "Assets", icon: Landmark },
  { href: "/liabilities", label: "Liabilities", icon: Scale },
];

/** Profile & app preferences — bottom of the nav, above theme toggle */
export const dashboardSettingsNavItem: DashboardNavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
};
