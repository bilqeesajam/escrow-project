// Color Theme Constants
export const THEME = {
  // Primary Colors
  primary: {
    gold: "#f5b800",
    darkNavy: "#0f1a2b",
    lightBlue: "#1a2235",
    cardBlue: "#232c40",
    borderGray: "#3a4456",
  },
  
  // Text Colors
  text: {
    white: "#ffffff",
    primary: "#c0c0c0",
    secondary: "#8b95ac",
    accent: "#ffffff",
  },

  // Gradients
  gradients: {
    mainBg: "from-[#0f1a2b] to-[#1a2235]",
    cardHover: "#f5b800",
  },

  // Hover States
  hover: {
    gold: "#f5b800",
    lightGold: "#ffc107",
    darkCard: "#232c40",
  },
} as const;

export type Theme = typeof THEME;
