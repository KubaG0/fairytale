/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#9c8edb',
          DEFAULT: '#8a6eff',
          dark: '#5f54b5',
        },
        secondary: {
          light: '#c4e0ff',
          DEFAULT: '#7db3f1',
          dark: '#5a94d3',
        },
        accent: {
          light: '#ffb98a',
          DEFAULT: '#ff9d4f',
          dark: '#e87f35',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}