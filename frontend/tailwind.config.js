const strandPreset = require("../../strand/tailwind-preset");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [strandPreset],
  content: ["./*.js", "./public/*.html", "./public/*.js"],
  theme: {
    extend: {
      fontFamily: {
        brand: ["'Milling'", "'Noto Sans'", "Helvetica", "Arial", "sans-serif"],
        "brand-bold": ["'Milling'", "'Noto Sans'", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
