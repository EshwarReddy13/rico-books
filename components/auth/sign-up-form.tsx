"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Lock, Mail, User } from "lucide-react";

import { AuthField } from "@/components/auth/auth-field";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { BrandMark } from "@/components/auth/brand-mark";
import { Button } from "@/components/ui/button";
import { signUpWithEmail } from "@/lib/actions/sign-up";

export function SignUpForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await signUpWithEmail(formData);

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-md flex-col text-black">
      <header className="mb-10 flex items-center gap-3">
        <BrandMark />
        <span className="text-lg font-semibold tracking-tight text-black">
          Rico Books
        </span>
      </header>

      <h1 className="text-3xl font-semibold tracking-tight text-black">
        Sign up
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <AuthField
          id="name"
          name="name"
          label="Full Name"
          type="text"
          icon={User}
          autoComplete="name"
          placeholder="John Doe"
          required
        />

        <AuthField
          id="email"
          name="email"
          label="Email Address"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="johndoe@gmail.com"
          required
        />

        <AuthField
          id="password"
          name="password"
          label="Password"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          placeholder="••••••••"
          minLength={8}
          required
        />

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={pending}
          className="mt-1 h-11 w-full bg-zinc-950 text-base text-white hover:bg-zinc-900"
        >
          {pending ? "Creating account…" : "Sign up"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <span className="text-auth-muted">Already have an account?</span>{" "}
        <Link
          href="/login"
          className="font-medium text-black underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>

      <footer className="mt-10">
        <SocialAuthButtons />
      </footer>
    </div>
  );
}
