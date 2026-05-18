import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: session } = await auth.getSession();

  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Phase 0
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Rico Books
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Finance &amp; ITR app skeleton — Next.js, Prisma (Neon), Neon Auth.
        </p>
        {session?.user?.email ? (
          <p className="mt-6 text-sm text-zinc-700 dark:text-zinc-300">
            Signed in as{" "}
            <span className="font-medium">
              {session.user.name ?? session.user.email}
            </span>
          </p>
        ) : (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/login" className="font-medium underline">
              Sign in
            </Link>{" "}
            to continue.
          </p>
        )}
        {session?.user ? (
          <div className="mt-8">
            <SignOutButton />
          </div>
        ) : null}
      </div>
    </main>
  );
}
