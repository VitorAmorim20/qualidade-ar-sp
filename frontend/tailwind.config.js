/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "Segoe UI", "sans-serif"],
      },
      colors: {
        ar: {
          50: "#f0f7f4",
          100: "#d7ebe3",
          500: "#1f7a5c",
          700: "#145c45",
          900: "#0c3328",
        },
      },
    },
  },
  plugins: [],
};
