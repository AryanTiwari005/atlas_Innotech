/** Theme tokens: dark plum-black surfaces, one red accent, soft rounded pills. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        ink:   { 950: '#100e15', 900: '#16131c', 800: '#1d1a25', 700: '#2a2633', 600: '#3a3544' },
        mist:  { 100: '#f4f2f7', 300: '#c4bfcd', 500: '#8f899b' },
        alert: { DEFAULT: '#f23d3d', soft: '#f23d3d1f', dark: '#c92a2a' },
        ok:    '#34d399',
        warn:  '#fbbf24',
      },
      borderRadius: { pill: '999px' },
      boxShadow: { glow: '0 0 0 1px #f23d3d55, 0 8px 30px -8px #f23d3d66' },
    },
  },
  plugins: [],
}
