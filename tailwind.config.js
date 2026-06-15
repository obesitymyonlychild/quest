/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'coral': '#FF6B6B',
        'amber': '#FFA726',
        'teal': '#26C6DA',
        'purple': '#AB47BC',
        'blue': '#42A5F5',
        'gray': '#78909C',
      },
    },
  },
  plugins: [],
}
