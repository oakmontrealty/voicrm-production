/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'oakmont-sage': '#636B56',
        'oakmont-brown': '#864936',
        'oakmont-tan': '#B28354',
        'oakmont-cream': '#F8F2E7',
        'oakmont-black': '#000000',
        'oakmont-grey': '#1B1B1B',
      },
      fontFamily: {
        'avenir': ['Avenir', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'forum': ['Forum', 'serif'],
      },
    },
  },
  plugins: [],
}