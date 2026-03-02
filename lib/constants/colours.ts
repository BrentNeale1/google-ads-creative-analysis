/**
 * Design system colour tokens for JS/TS usage (e.g. Recharts, inline styles).
 * Mirrors the Tailwind theme configuration in tailwind.config.ts.
 * Use Tailwind utility classes (bg-brand-blue, text-brand-red, etc.) in JSX.
 * Use these constants when Tailwind classes don't apply (chart libraries, canvas, etc.).
 */
export const COLOURS = {
  brand: {
    blue: "#1A73E8",
    green: "#34A853",
    red: "#EA4335",
    grey: "#9AA0A6",
    amber: "#FBBC04",
  },
  surface: {
    background: "#F8F9FA",
    gridline: "#E8EAED",
    tableHeader: "#F1F3F4",
    rowPositive: "#E6F4EA",
    rowNegative: "#FCE8E6",
  },
} as const;
