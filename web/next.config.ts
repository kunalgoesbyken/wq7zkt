import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const apiOrigin = process.env.API_ORIGIN;

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(apiOrigin && {
    rewrites: async () => [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }],
  }),
};

export default createNextIntlPlugin()(nextConfig);
