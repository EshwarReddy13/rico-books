import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/login",
});

export const config = {
  matcher: [
    "/((?!login|sign-up|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
