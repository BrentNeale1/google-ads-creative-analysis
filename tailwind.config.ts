import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
          "table-header": "#F1F3F4",
          "row-positive": "#E6F4EA",
          "row-negative": "#FCE8E6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
