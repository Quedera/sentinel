/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // The docusign-esign SDK uses non-relative internal imports
    // (e.g. require("api/AccountsApi")) that webpack can't bundle
    // (it tries to resolve them as module requests, not relative).
    // Marking the whole package external lets Node's resolver handle
    // it at runtime — the SDK is server-only anyway (used in API routes).
    serverComponentsExternalPackages: ["docusign-esign"],
  },
};

module.exports = nextConfig;
