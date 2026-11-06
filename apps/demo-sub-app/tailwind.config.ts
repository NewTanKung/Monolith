import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#05070e",
          card: "rgba(12, 17, 30, 0.65)",
          border: "rgba(0, 242, 254, 0.2)",
          neon: "#00f2fe",
        },
      },
      boxShadow: {
        neon: "0 0 30px -5px rgba(0, 242, 254, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
