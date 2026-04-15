/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: { 50: '#fdfaf5', 100: '#faf5ef', 200: '#f5ead9' },
        coral:   { 400: '#ff8b6a', 500: '#ff7b54', 600: '#e8663d' },
        lavender:{ 400: '#c4b5fd', 500: '#a78bfa', 600: '#8b5cf6' },
        mint:    { 400: '#6ee7b7', 500: '#34d399', 600: '#10b981' },
        sky:     { 400: '#7dd3fc', 500: '#38bdf8', 600: '#0284c7' },
        rose:    { 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48' },
        amber:   { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft:   '0 4px 24px rgba(0,0,0,0.06)',
        medium: '0 8px 32px rgba(0,0,0,0.10)',
        lift:   '0 16px 48px rgba(0,0,0,0.14)',
        glow:   '0 0 20px rgba(167,139,250,0.35)',
        'glow-coral': '0 0 20px rgba(255,123,84,0.35)',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow':  'pulse 3s infinite',
        float:         'float 3s ease-in-out infinite',
        wiggle:        'wiggle 0.5s ease-in-out',
        'spin-slow':   'spin 6s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%':      { transform: 'rotate(5deg)' },
        },
      },
    },
  },
  plugins: [],
}
