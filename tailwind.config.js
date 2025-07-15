/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'roberto': ['Roberto', 'sans-serif'],
      },
      colors: {
        wordle: {
          correct: '#ff69b4', // pink accent for correct
          present: '#e5e5e5', // light gray for present
          absent: '#cccccc', // gray for absent
          tile: '#ffffff', // white tile background
          border: '#222222', // black border
          text: '#111111', // black text
          background: '#fafafa', // very light gray background
        },
        glass: {
          white: 'rgba(255,255,255,0.8)',
          dark: 'rgba(0,0,0,0.05)',
          card: 'rgba(255,255,255,0.95)',
          backdrop: 'rgba(0,0,0,0.2)',
        },
        accent: {
          pink: '#ff69b4',
        },
      },
      backgroundImage: {
        'main-gradient': 'none',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'flip': 'flip 0.6s ease-in-out',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(106, 170, 100, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(106, 170, 100, 0.8)' },
        },
        flip: {
          '0%': { transform: 'rotateX(0deg)' },
          '50%': { transform: 'rotateX(90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        }
      }
    },
  },
  plugins: [],
} 