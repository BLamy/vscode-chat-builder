/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'blue-bubble': '#0a84ff',
        'green-bubble': '#34c759',
      },
    },
  },
  plugins: [require("daisyui")],
}

