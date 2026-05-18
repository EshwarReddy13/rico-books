"use client";

import { CurrencyToggle } from "@/components/dashboard/currency-toggle";
import { SettingsRow } from "@/components/settings/settings-row";
import { SettingsSection } from "@/components/settings/settings-section";
import { SettingsThemeToggle } from "@/components/settings/settings-theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getNavUserDisplayName,
  getNavUserInitials,
  type NavUser,
} from "@/lib/dashboard/nav-user";
export function SettingsPage({ user }: { user: NavUser | null }) {
  const displayName = getNavUserDisplayName(user);
  const initials = getNavUserInitials(user);
  const email = user?.email ?? "";

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-2xl flex-col gap-4 sm:gap-5">
      <SettingsSection
        title="Profile"
        description="Your sign-in identity. Books and tax settings live on their own pages."
      >
        <div className="flex flex-col gap-5 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-4">
            {user?.image ? (
              <img
                src={user.image}
                alt=""
                className="size-16 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800"
              />
            ) : (
              <span
                className="flex size-16 items-center justify-center rounded-full bg-violet-100 text-lg font-semibold text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"
                aria-hidden
              >
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-zinc-950 dark:text-zinc-50">
                {displayName}
              </p>
              {email ? (
                <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                  {email}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="settings-name">Display name</Label>
              <Input
                id="settings-name"
                defaultValue={user?.name ?? ""}
                placeholder={displayName}
                disabled
                className="h-10 bg-zinc-50 dark:bg-zinc-800/50"
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="settings-email">Email</Label>
              <Input
                id="settings-email"
                type="email"
                defaultValue={email}
                disabled
                className="h-10 bg-zinc-50 dark:bg-zinc-800/50"
              />
            </div>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Name and email are managed by your sign-in provider (Neon Auth).
          </p>

          <div className="flex justify-end">
            <Button type="button" disabled size="sm" variant="secondary">
              Save profile
            </Button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Display"
        description="How amounts and the interface appear across the app."
      >
        <SettingsRow
          label="Currency"
          description="Skeleton toggle for reports and registers. Ledger amounts are stored in INR (paise)."
        >
          <CurrencyToggle />
        </SettingsRow>
        <SettingsRow
          label="Theme"
          description="Light or dark appearance. Also available in the side nav."
        >
          <SettingsThemeToggle />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Account">
        <SettingsRow
          label="Sign out"
          description="End your session on this device. You can sign in again anytime."
        >
          <SignOutButton />
        </SettingsRow>
      </SettingsSection>

      <p className="px-1 text-center text-xs text-zinc-400 dark:text-zinc-500">
        Rico Books · single-user finance & ITR prep
      </p>
    </div>
  );
}
