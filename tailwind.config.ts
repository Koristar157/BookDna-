import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14231C",   // deep bottle-green-black, primary dark
          50: "#F3F6F4",
          100: "#DEE6E1",
          200: "#B7C9BE",
          300: "#8AA695",
          400: "#5C806A",
          500: "#3B5C46",
          600: "#294536",
          700: "#1E362A",
          800: "#182B22",
          900: "#14231C",
        },
        parchment: {
          DEFAULT: "#F6F1E4",
          soft: "#EFE7D4",
        },
        berry: {
          DEFAULT: "#B23A48",
          light: "#D46A76",
          dark: "#7E2733",
        },
        gold: {
          DEFAULT: "#C79A3D",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-public-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "8px",
        lg: "14px",
      },
      backgroundImage: {
        "spine-lines":
          "repeating-linear-gradient(90deg, rgba(20,35,28,0.06) 0px, rgba(20,35,28,0.06) 2px, transparent 2px, transparent 14px)",
      },
    },
  },
  plugins: [],
};

export default config;
