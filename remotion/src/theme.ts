export const theme = {
  bg: "#1a1a1a",
  fg: "#d9d9d9",
  muted: "#808080",
  border: "#333333",
  secondary: "#2a2a2a",
  orange: "#ff6b2b",
  agreed: "#4ade80",
  white: "#ffffff",
  cardBg: "#1a1a1a",
} as const;

export const swissLabel = {
  fontSize: 9,
  fontWeight: 700 as const,
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  color: theme.muted,
};
