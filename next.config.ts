import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The PNG routes read these with fs, so tracing has to keep them.
  outputFileTracingIncludes: { "/api/posts/**": ["./public/fonts/**"] },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
