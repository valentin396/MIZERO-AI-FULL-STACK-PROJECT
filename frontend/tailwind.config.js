/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16241C',
        clay: '#DC2626',
        'clay-dark': '#B91C1C',
        ochre: '#D97706',
        hills: '#16A34A',
        'hills-light': '#22C55E',
        paper: '#F7FAF8',
        cream: '#FFFFFF',
        line: '#E5E9E7',
        blueinfo: '#2563EB',
      },
    },
  },
  plugins: [],
};
