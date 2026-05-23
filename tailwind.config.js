export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        'pastel-pink': '#cc6d78',
        'pastel-cyan': '#0E7490',
        'pastel-purple': '#5c4257',
        'pastel-yellow': '#f0dccf',
        'pastel-green': '#81C784',
        'light-bg': '#FDFBF7',
        'panel-bg': '#FFFFFF',
      },
      boxShadow: {
        'pastel-pink': '4px 4px 0px theme("colors.pastel-pink")',
        'pastel-cyan': '4px 4px 0px theme("colors.pastel-cyan")',
        'pastel-purple': '4px 4px 0px theme("colors.pastel-purple")',
        'pastel-yellow': '4px 4px 0px theme("colors.pastel-yellow")',
        'pastel-green': '4px 4px 0px theme("colors.pastel-green")',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
        'exp-gradient': 'linear-gradient(90deg, #e694afff, #e8cf7eff, #88dce7ff)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      }
    }
  },
  plugins: [],
}
