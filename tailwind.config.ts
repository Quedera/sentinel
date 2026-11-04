import type { Config } from "tailwindcss";
// Vendored into the repo (branding/) rather than reached at
// ../branding/ in the workspace, so a standalone clone of this repo - and
// a Docker build context - resolves it. Palette codes only, no secrets.
import quederaPreset from "./branding/quedera-tailwind-preset.cjs";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      ...quederaPreset.theme.extend,
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
