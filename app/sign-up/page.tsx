import { AuthShowcasePanel } from "@/components/auth/auth-showcase-panel";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-20">
        <SignUpForm />
      </section>

      <section className="hidden p-4 pl-0 lg:block lg:p-6 lg:pl-0">
        <AuthShowcasePanel />
      </section>
    </main>
  );
}
