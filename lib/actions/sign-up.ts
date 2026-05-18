"use server";

import { auth } from "@/lib/auth/server";

export type AuthFormState = {
  error?: string;
  success?: boolean;
};

function isSignupAllowed(email: string): boolean {
  const allowed = process.env.ALLOWED_SIGNUP_EMAIL?.trim().toLowerCase();
  if (!allowed) {
    return true;
  }
  return email.trim().toLowerCase() === allowed;
}

export async function signUpWithEmail(
  formData: FormData,
): Promise<AuthFormState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";

  if (!email) {
    return { error: "Email address is required." };
  }

  if (!isSignupAllowed(email)) {
    return { error: "Sign-up is not allowed for this email address." };
  }

  const password = formData.get("password") as string;
  if (!password) {
    return { error: "Password is required." };
  }

  const { error } = await auth.signUp.email({
    email,
    name: (formData.get("name") as string | null)?.trim() ?? "",
    password,
  });

  if (error) {
    return { error: error.message ?? "Failed to create account." };
  }

  return { success: true };
}
