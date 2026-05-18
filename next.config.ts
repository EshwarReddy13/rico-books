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
    ];
  },
};

export default nextConfig;
