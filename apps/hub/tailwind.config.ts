import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#08090d",
        foreground: "#f3f4f6",
        liquid: {
          dark: "#0b0d14",
          card: "rgba(18, 22, 34, 0.55)",
          cardHover: "rgba(28, 34, 52, 0.7)",
          border: "rgba(255, 255, 255, 0.08)",
          borderHover: "rgba(255, 255, 255, 0.2)",
          glass: "rgba(255, 255, 255, 0.03)",
        },
      },
      boxShadow: {
        "liquid-sm":
          "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
        "liquid-md":
          "0 16px 40px -8px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)",
        "liquid-glow-indigo": "0 0 40px -10px rgba(99, 102, 241, 0.35)",
        "liquid-glow-cyan": "0 0 40px -10px rgba(6, 182, 212, 0.35)",
        "liquid-glow-purple": "0 0 40px -10px rgba(168, 85, 247, 0.35)",
      },
      backdropBlur: {
        xs: "2px",
        "3xl": "64px",
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        "pulse-slow": "pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
