export type Theme = {
  dark: boolean;
  bg: string;
  card: string;
  border: string;
  text: string;
  subtext: string;
  accent: string;
  success: string;
  danger: string;
  warning: string;
};

export const lightTheme: Theme = {
  dark: false,
  bg: "#F5F5F7",
  card: "#FFFFFF",
  border: "#E2E2E6",
  text: "#1C1C1E",
  subtext: "#6B6B73",
  accent: "#3B82F6",
  success: "#22C55E",
  danger: "#EF4444",
  warning: "#F59E0B",
};

export const darkTheme: Theme = {
  dark: true,
  bg: "#0E0E10",
  card: "#1C1C1E",
  border: "#2C2C2E",
  text: "#F2F2F3",
  subtext: "#9A9AA0",
  accent: "#5B9CF6",
  success: "#34D058",
  danger: "#FF6B6B",
  warning: "#FBBF24",
};
