import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#EEF4FA",
          100: "#D8E5F3",
          200: "#B3CCE7",
          300: "#7FA8D3",
          400: "#4A7FB8",
          500: "#2C5A8C",
          600: "#1D4268",
          700: "#16365A",
          800: "#0F2D4A",
          900: "#0A1F35",
          950: "#061525",
          DEFAULT: "#0F2D4A",
        },
        accent: {
          50: "#E9FBF0",
          100: "#C9F5DB",
          200: "#96EBB8",
          300: "#5FDD94",
          400: "#3ED57F",
          500: "#2ECC71",
          600: "#26AB5F",
          700: "#1F8A4D",
          800: "#196F3E",
          900: "#14572F",
          DEFAULT: "#2ECC71",
        },
      },
    },
  },
  plugins: [],
};

export default config;
