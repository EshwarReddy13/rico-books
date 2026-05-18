import type { Metadata } from "next";
import { Rubik } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rico Books",
  description: "Finance & ITR app — categorized P&L, balance sheet, ITR-3 prep",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${rubik.variable} h-full font-sans antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
