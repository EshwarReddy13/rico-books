import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/login",
});

export const config = {
  matcher: [
    // api/entities* excluded — middleware redirect returns HTML and breaks fetch JSON;
    // those routes call requireSession() and return 401 JSON instead.
    "/((?!login|sign-up|api/auth|api/entities|api/categories|api/accounts|api/import|api/ai|api/categorize|api/transactions|_next/static|_next/image|favicon.ico).*)",
  ],
};
