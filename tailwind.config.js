/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0a1628",
        orange: "#e8441a",
        blue: "#1a6ee8",
        green: "#18b368",
        muted: "#9b9892",
      },
    },
  },
  plugins: [],
}