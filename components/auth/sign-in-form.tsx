"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Lock, Mail } from "lucide-react";

import { AuthField } from "@/components/auth/auth-field";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { BrandMark } from "@/components/auth/brand-mark";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  signInWithEmail,
  type AuthFormState,
} from "@/lib/actions/login";

const initialState: AuthFormState = {};

export function SignInForm() {
  const [state, formAction, pending] = useActionState(
    signInWithEmail,
    initialState,
  );

  return (
    <div className="flex w-full max-w-md flex-col text-black">
      <header className="mb-10 flex items-center gap-3">
        <BrandMark />
        <span className="text-lg font-semibold tracking-tight text-black">
          Rico Books
        </span>
      </header>

      <h1 className="text-3xl font-semibold tracking-tight text-black">
        Sign in
      </h1>

      <form action={formAction} className="mt-8 flex flex-col gap-5">
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
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            name="remember"
            className="border-neutral-200 bg-white data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground"
          />
          <Label
            htmlFor="remember"
            className="cursor-pointer font-normal text-black"
          >
            Remember me
          </Label>
        </div>

        {state?.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={pending}
          className="mt-1 h-11 w-full bg-zinc-950 text-base text-white hover:bg-zinc-900"
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <span className="text-auth-muted">Don&apos;t have an account?</span>{" "}
        <Link
          href="/sign-up"
          className="font-medium text-black underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </p>

      <p className="mt-2 text-center">
        <Link
          href="#"
          className="text-sm text-black underline-offset-4 hover:underline"
          onClick={(e) => e.preventDefault()}
          title="Password reset — coming soon"
        >
          Forgot Password
        </Link>
      </p>

      <footer className="mt-10">
        <SocialAuthButtons />
      </footer>
    </div>
  );
}
