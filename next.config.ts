import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mammoth", "pdfjs-dist"],
  // Force Vercel/serverless tracing to include the pdfjs worker file,
  // which is dynamically loaded at runtime but not statically analyzable.
  outputFileTracingIncludes: {
    "/api/extract": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
};

export default nextConfig;
