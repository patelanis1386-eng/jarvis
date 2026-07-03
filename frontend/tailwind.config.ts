import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/stores/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jarvis: {
          blue: {
            50: "#e0f7ff",
            100: "#b3ecff",
            200: "#80e0ff",
            300: "#4dd4ff",
            400: "#26caff",
            500: "#00bfff",
            600: "#0099cc",
            700: "#007399",
            800: "#004d66",
            900: "#002633",
            DEFAULT: "#00bfff",
          },
          cyan: {
            50: "#e0fff7",
            100: "#b3ffec",
            200: "#80ffe0",
            300: "#4dffd4",
            400: "#26ffca",
            500: "#00ffbf",
            600: "#00cc99",
            700: "#009973",
            800: "#00664d",
            900: "#003326",
            DEFAULT: "#00ffbf",
          },
          purple: {
            50: "#f3e0ff",
            100: "#e0b3ff",
            200: "#cc80ff",
            300: "#b84dff",
            400: "#a826ff",
            500: "#9900ff",
            600: "#7a00cc",
            700: "#5c0099",
            800: "#3d0066",
            900: "#1f0033",
            DEFAULT: "#9900ff",
          },
          dark: {
            50: "#f0f0f0",
            100: "#d9d9d9",
            200: "#bfbfbf",
            300: "#a6a6a6",
            400: "#8c8c8c",
            500: "#737373",
            600: "#595959",
            700: "#404040",
            800: "#262626",
            900: "#0d0d0d",
            950: "#050505",
            DEFAULT: "#0d0d0d",
          },
          surface: {
            DEFAULT: "#111118",
            light: "#1a1a24",
            lighter: "#22222e",
            border: "#2a2a3a",
            hover: "#33334a",
          },
          glass: {
            DEFAULT: "rgba(17, 17, 24, 0.6)",
            light: "rgba(26, 26, 36, 0.4)",
            border: "rgba(0, 191, 255, 0.15)",
            hover: "rgba(0, 191, 255, 0.1)",
          },
        },
      },
      fontFamily: {
        orbitron: ["Orbitron", "monospace"],
        inter: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "100": "25rem",
        "120": "30rem",
        "128": "32rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 191, 255, 0.3)",
        "glow-lg": "0 0 40px rgba(0, 191, 255, 0.4)",
        "glow-cyan": "0 0 20px rgba(0, 255, 191, 0.3)",
        "glow-purple": "0 0 20px rgba(153, 0, 255, 0.3)",
        "glass": "0 8px 32px rgba(0, 0, 0, 0.3)",
        "inner-glow": "inset 0 0 20px rgba(0, 191, 255, 0.05)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "scan": "scan 2s linear infinite",
        "waveform": "waveform 1.5s ease-in-out infinite",
        "thinking": "thinking-pulse 1.5s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 10px rgba(0, 191, 255, 0.3)",
            opacity: "0.8",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(0, 191, 255, 0.6)",
            opacity: "1",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        waveform: {
          "0%, 100%": { height: "4px" },
          "50%": { height: "20px" },
        },
        "thinking-pulse": {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "grid-pattern":
          "linear-gradient(rgba(0, 191, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 191, 255, 0.03) 1px, transparent 1px)",
        "holographic":
          "linear-gradient(135deg, rgba(0, 191, 255, 0.05) 0%, transparent 50%, rgba(153, 0, 255, 0.05) 100%)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
    },
  },
  plugins: [],
};

export default config;
