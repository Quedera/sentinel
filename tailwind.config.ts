import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        quedera: {
          navy: "#0A1F3D",
          ink: "#1A2A40",
          slate: "#475569",
        },
        sentinel: {
          DEFAULT: "#2EBA8E",
          dark: "#1F9D78",
          light: "#7BD9B5",
          tint: "#E5F8F1",
        },
      },
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
