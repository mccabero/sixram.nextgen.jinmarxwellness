import type { NextConfig } from "next";

const defaultDevelopmentApiBaseUrl = "http://localhost:5196";
const defaultProductionInternalApiBaseUrl = "http://127.0.0.1:5000";

const internalApiBaseUrl =
  process.env.INTERNAL_API_BASE_URL ??
  (process.env.NODE_ENV === "production"
    ? defaultProductionInternalApiBaseUrl
    : process.env.NEXT_PUBLIC_API_BASE_URL ?? defaultDevelopmentApiBaseUrl);

const apiBaseUrl = internalApiBaseUrl.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`,
      },
      {
        source: "/openapi/:path*",
        destination: `${apiBaseUrl}/openapi/:path*`,
      },
    ];
  },
};

export default nextConfig;
