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
          correct: '#ff69b4', // vibrant pink for correct
          present: '#ffb6c1', // light pink for present
          absent: '#f8bbd0', // pale pink for absent
          tile: '#fff0f6', // very light pink tile background
          border: '#ff69b4', // pink border
          text: '#b8005c', // deep pink text
          background: 'linear-gradient(135deg, #fff0f6 0%, #ffb6c1 100%)',
        },
        glass: {
          white: 'rgba(255, 240, 246, 0.7)',
          dark: 'rgba(255, 182, 193, 0.2)',
          card: 'rgba(255, 240, 246, 0.95)',
          backdrop: 'rgba(255, 182, 193, 0.5)',
        },
        vibrant: {
          pink: '#ff69b4',
          light: '#ffb6c1',
          pale: '#fff0f6',
          deep: '#b8005c',
        },
      },
      backgroundImage: {
        'main-gradient': 'linear-gradient(135deg, #fff0f6 0%, #ffb6c1 100%)',
        'vibrant-radial': 'radial-gradient(circle at 20% 80%, #ff69b4 0%, #ffb6c1 100%)',
        'vibrant-linear': 'linear-gradient(120deg, #ffb6c1 0%, #ff69b4 100%)',
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