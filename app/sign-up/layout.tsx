import { AuthPageShell } from "@/components/auth/auth-page-shell";

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthPageShell>{children}</AuthPageShell>;
}
