/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-vision': '#11003b',
        'brand-people': '#359e38',
        'brand-execution': '#D91145',
      }
    },
  },
  plugins: [],
};
