export const colors = {
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
    surface: "#111118",
    "surface-light": "#1a1a24",
    "surface-lighter": "#22222e",
    "surface-border": "#2a2a3a",
    "surface-hover": "#33334a",
  } as const,
} as const;

export const fonts = {
  orbitron: "Orbitron, monospace",
  inter: "Inter, sans-serif",
  mono: "JetBrains Mono, Fira Code, monospace",
} as const;

export const spacing = {
  0: "0px",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  18: "4.5rem",
  20: "5rem",
  24: "6rem",
  32: "8rem",
  40: "10rem",
  48: "12rem",
  56: "14rem",
  64: "16rem",
  72: "18rem",
  80: "20rem",
  88: "22rem",
  96: "24rem",
  100: "25rem",
  120: "30rem",
  128: "32rem",
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export const zIndices = {
  base: 1,
  dropdown: 50,
  sticky: 100,
  overlay: 200,
  modal: 300,
  toast: 400,
  tooltip: 500,
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.3)",
  md: "0 4px 16px rgba(0, 0, 0, 0.3)",
  lg: "0 8px 32px rgba(0, 0, 0, 0.3)",
  glow: "0 0 20px rgba(0, 191, 255, 0.3)",
  "glow-lg": "0 0 40px rgba(0, 191, 255, 0.4)",
  "glow-cyan": "0 0 20px rgba(0, 255, 191, 0.3)",
  "glow-purple": "0 0 20px rgba(153, 0, 255, 0.3)",
  glass: "0 8px 32px rgba(0, 0, 0, 0.3)",
  inner: "inset 0 0 20px rgba(0, 191, 255, 0.05)",
} as const;

export const animationDurations = {
  fast: "150ms",
  base: "250ms",
  slow: "400ms",
  slower: "600ms",
} as const;

export const theme = {
  colors,
  fonts,
  spacing,
  breakpoints,
  zIndices,
  shadows,
  animationDurations,
} as const;

export type Theme = typeof theme;
export default theme;
