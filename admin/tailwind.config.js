/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cloud: '#FFF7FB',
        sakura: '#FFD6E8',
        sky: '#B5E8FF',
        sun: '#FFE8A3',
        mint: '#C8F4DE',
        blush: '#FFB4B4',
        ink: '#4A4063',
        'ink-soft': '#7A6F94',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'cursive'],
        body: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        blob: '2rem',
      },
      keyframes: {
        drift: {
          '0%': { transform: 'translateX(-8%)' },
          '100%': { transform: 'translateX(8%)' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        blink: {
          '0%, 90%, 100%': { transform: 'scaleY(1)' },
          '95%': { transform: 'scaleY(0.1)' },
        },
      },
      animation: {
        drift: 'drift 18s ease-in-out infinite alternate',
        'drift-slow': 'drift 26s ease-in-out infinite alternate',
        bob: 'bob 4s ease-in-out infinite',
        blink: 'blink 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
