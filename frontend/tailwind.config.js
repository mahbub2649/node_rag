/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'cyber-blue': '#00f6ff',
        'cyber-purple': '#7e22ce',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { 'box-shadow': '0 0 5px #00f6ff, 0 0 10px #00f6ff, 0 0 15px #00f6ff' },
          '100%': { 'box-shadow': '0 0 10px #00f6ff, 0 0 20px #00f6ff, 0 0 30px #00f6ff' },
        },
      },
    },
  },
  plugins: [],
} 