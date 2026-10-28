/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { kid: ['"Baloo 2"', 'Nunito', 'system-ui', 'sans-serif'] },
      colors: {
        cream: '#fff8ec',
        grape: { DEFAULT: '#7c5cff', dark: '#5a3fd6', light: '#ece6ff' },
        mint: { DEFAULT: '#22c55e', light: '#dcfce7' },
        sun: { DEFAULT: '#ffb020', light: '#fff1d1' },
        coral: { DEFAULT: '#ff8a4c', light: '#ffe8dc' },
        sky2: { DEFAULT: '#38bdf8', light: '#e0f4ff' },
      },
      boxShadow: { pop: '0 6px 0 rgba(0,0,0,0.12)', popsm: '0 4px 0 rgba(0,0,0,0.12)' },
      keyframes: {
        bounceIn: { '0%': { transform: 'scale(.6)', opacity: 0 }, '60%': { transform: 'scale(1.08)', opacity: 1 }, '100%': { transform: 'scale(1)' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-8px)' }, '75%': { transform: 'translateX(8px)' } },
        floatUp: { '0%': { transform: 'translateY(0)' }, '100%': { transform: 'translateY(-130vh)' } },
        wiggle: { '0%,100%': { transform: 'rotate(-4deg)' }, '50%': { transform: 'rotate(4deg)' } },
        hop: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
      },
      animation: {
        bounceIn: 'bounceIn .45s ease-out both',
        shake: 'shake .35s ease-in-out',
        wiggle: 'wiggle 1.6s ease-in-out infinite',
        hop: 'hop .6s ease-in-out',
      },
    },
  },
  plugins: [],
}
