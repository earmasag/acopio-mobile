/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        acopio: {
          bg: "#F0F7F4",
          surface: "#FFFFFF",
          text: "#081C15",
          muted: "#52796F",
          accent: "#1B4332",
          "accent-light": "#2D6A4F",
        },
      },
    },
  },
  plugins: [],
};
