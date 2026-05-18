"use server";

import { auth } from "@/lib/auth/server";

export type AuthFormState = {
  error?: string;
  success?: boolean;
};

export async function signInWithEmail(
  formData: FormData,
): Promise<AuthFormState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await auth.signIn.email({
    email,
    password,
  });

  if (error) {
    return { error: error.message ?? "Failed to sign in. Try again." };
  }

  return { success: true };
}
