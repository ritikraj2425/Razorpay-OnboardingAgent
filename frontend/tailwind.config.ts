import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        line: "#d8dee8",
        panel: "#ffffff",
        field: "#f7f9fc",
        mint: "#0f766e",
        amber: "#b45309",
        danger: "#b42318",
        cobalt: "#1d4ed8"
      },
      boxShadow: {
        soft: "0 12px 28px rgba(16, 24, 40, 0.08)"
      }
    },
  },
  plugins: [],
};

export default config;
