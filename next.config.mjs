import fs from "node:fs";

// If starting the dev server while a previous production build (.next/BUILD_ID) exists,
// remove the stale production server bundle to prevent webpack chunk mismatch (e.g. Cannot find module './276.js').
if (process.env.NODE_ENV === "development" || process.argv.includes("dev")) {
  try {
    if (fs.existsSync(".next/BUILD_ID")) {
      fs.rmSync(".next", { recursive: true, force: true });
    }
  } catch {
    // Ignore if directory cannot be deleted synchronously
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["pg"],
  },
};

export default nextConfig;
