import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rzp: {
          navy: "#02042b",
          blue: "#2b6add",
          "blue-light": "#528ff0",
          "blue-subtle": "#e8f0fe",
          teal: "#1ca774",
          "teal-subtle": "#ecfdf3",
          orange: "#f26522",
          red: "#e5383b",
          "red-subtle": "#fef3f2",
          yellow: "#f5a623",
          "yellow-subtle": "#fffaeb",
        },
        surface: "var(--surface)",
        border: "var(--border)",
        accent: {
          DEFAULT: "#2b6add",
          subtle: "#e8f0fe",
        },
        success: {
          DEFAULT: "#1ca774",
          subtle: "#ecfdf3",
        },
        warning: {
          DEFAULT: "#f5a623",
          subtle: "#fffaeb",
        },
        danger: {
          DEFAULT: "#e5383b",
          subtle: "#fef3f2",
        },
        gray: {
          25: "#fcfcfd",
          50: "#f4f5f7",
          100: "#eceef2",
          200: "#e0e4ea",
          300: "#cdd3dc",
          400: "#8b949e",
          500: "#57606a",
          600: "#3d4752",
          700: "#2c333b",
          800: "#1c2128",
          900: "#0d1117",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(13,17,23,0.04)",
        sm: "0 1px 3px rgba(13,17,23,0.06), 0 1px 2px rgba(13,17,23,0.03)",
        md: "0 4px 8px -2px rgba(13,17,23,0.06), 0 2px 4px -2px rgba(13,17,23,0.03)",
        lg: "0 12px 24px -4px rgba(13,17,23,0.08), 0 4px 8px -4px rgba(13,17,23,0.03)",
        xl: "0 20px 48px -8px rgba(13,17,23,0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease forwards",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "slide-down": "slideDown 0.3s ease forwards",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
