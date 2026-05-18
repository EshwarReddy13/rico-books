"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

export type AuthFormState = {
  error?: string;
};

function isSignupAllowed(email: string): boolean {
  const allowed = process.env.ALLOWED_SIGNUP_EMAIL?.trim().toLowerCase();
  if (!allowed) {
    return true;
  }
  return email.trim().toLowerCase() === allowed;
}

export async function signUpWithEmail(
  _prevState: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get("email") as string;

  if (!email?.trim()) {
    return { error: "Email address is required." };
  }

  if (!isSignupAllowed(email)) {
    return { error: "Sign-up is not allowed for this email address." };
  }

  const { error } = await auth.signUp.email({
    email,
    name: formData.get("name") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message ?? "Failed to create account." };
  }

  redirect("/");
}
