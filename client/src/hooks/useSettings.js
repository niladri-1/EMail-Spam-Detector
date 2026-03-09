// src/hooks/useSettings.js

export const THEMES = {
  dark: { bg: "#1a1a1a" },
  darker: { bg: "#0f0f0f" },
  warm: { bg: "#1c1814" },
  forest: { bg: "#111a14" },
  ocean: { bg: "#0f1520" },
  rose: { bg: "#1a1015" },
};

export const ACCENT_COLORS = {
  orange: {
    color: "#c96442",
    hover: "#b8572f",
    dim: "rgba(201,100,66,0.12)",
    glow: "rgba(201,100,66,0.28)",
  },
  green: {
    color: "#4ade80",
    hover: "#22c55e",
    dim: "rgba(74,222,128,0.12)",
    glow: "rgba(74,222,128,0.28)",
  },
  blue: {
    color: "#60a5fa",
    hover: "#3b82f6",
    dim: "rgba(96,165,250,0.12)",
    glow: "rgba(96,165,250,0.28)",
  },
  pink: {
    color: "#f472b6",
    hover: "#ec4899",
    dim: "rgba(244,114,182,0.12)",
    glow: "rgba(244,114,182,0.28)",
  },
  yellow: {
    color: "#fbbf24",
    hover: "#f59e0b",
    dim: "rgba(251,191,36,0.12)",
    glow: "rgba(251,191,36,0.28)",
  },
  purple: {
    color: "#a78bfa",
    hover: "#8b5cf6",
    dim: "rgba(167,139,250,0.12)",
    glow: "rgba(167,139,250,0.28)",
  },
};

export const FONT_SIZES = {
  sm: "13px",
  md: "14px",
  lg: "15px",
};

export function applySettings() {
  const theme = localStorage.getItem("theme") || "dark";
  const accent = localStorage.getItem("accent") || "orange";
  const fontSize = localStorage.getItem("fontSize") || "md";

  const t = THEMES[theme] || THEMES.dark;
  const a = ACCENT_COLORS[accent] || ACCENT_COLORS.orange;
  const f = FONT_SIZES[fontSize] || FONT_SIZES.md;

  const root = document.documentElement;
  root.style.setProperty("--bg", t.bg);
  root.style.setProperty("--accent", a.color);
  root.style.setProperty("--accent-hover", a.hover);
  root.style.setProperty("--accent-dim", a.dim);
  root.style.setProperty("--accent-glow", a.glow);
  root.style.setProperty("--font-size", f);
  document.body.style.background = t.bg;
  document.body.style.fontSize = f;
}
