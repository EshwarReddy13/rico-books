"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * React 19 warns when next-themes injects its inline <script> for FOUC prevention.
 * The script still runs on the server; this only silences the known false-positive in dev.
 * @see https://github.com/pacocoursey/next-themes/issues/387
 */
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0];
    if (
      typeof first === "string" &&
      first.includes("Encountered a script tag while rendering React component")
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      storageKey="rico-books-theme"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
