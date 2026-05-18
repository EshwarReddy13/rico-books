export type PageHeader = {
  title: string;
  subtitle: string;
};

const pageHeaders: Record<string, PageHeader> = {
  "/": {
    title: "Dashboard",
    subtitle: "Overview of your income, expenses, and profit.",
  },
  "/transactions": {
    title: "Transactions",
    subtitle:
      "Review imports, confirm categories, and browse your full ledger.",
  },
  "/reports": {
    title: "Reports",
    subtitle: "View profit and loss, balance sheet, and tax-ready exports.",
  },
  "/categories": {
    title: "Categories",
    subtitle: "Manage your category tree and sub-categories.",
  },
  "/assets": {
    title: "Assets",
    subtitle: "Bank accounts, fixed assets, and import profiles.",
  },
  "/liabilities": {
    title: "Liabilities",
    subtitle: "Loans, liability accounts, and amortization schedules.",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Profile, preferences, and general app options.",
  },
};

const defaultHeader: PageHeader = {
  title: "Dashboard",
  subtitle: "Overview of your income, expenses, and profit.",
};

export function getPageHeader(pathname: string): PageHeader {
  if (pageHeaders[pathname]) {
    return pageHeaders[pathname];
  }

  const match = Object.keys(pageHeaders)
    .filter((href) => href !== "/")
    .sort((a, b) => b.length - a.length)
    .find((href) => pathname === href || pathname.startsWith(`${href}/`));

  return match ? pageHeaders[match] : defaultHeader;
}
