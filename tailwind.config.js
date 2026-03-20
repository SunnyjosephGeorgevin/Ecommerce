/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0B0B0D',
        'accent-red': '#C8102E',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      boxShadow: {
        'red-glow': '0 0 20px rgba(200, 16, 46, 0.3)',
        'red-glow-lg': '0 0 40px rgba(200, 16, 46, 0.4)',
      },
    },
  },
  plugins: [],
}
