import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/auth/sign-in",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/auth/sign-up",
        destination: "/sign-up",
        permanent: true,
      },
      {
        source: "/import",
        destination: "/",
        permanent: false,
      },
      {
        source: "/review",
        destination: "/transactions",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
