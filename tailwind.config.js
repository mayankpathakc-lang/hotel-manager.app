/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          rose: '#FFD6E0',
          peach: '#FFE4CC',
          yellow: '#FFF3CC',
          mint: '#CCF5E1',
          sky: '#CCE8FF',
          lavender: '#FFE8D6',
          lilac: '#FFD9B3',
          blush: '#FFE0EC',
          cream: '#FFF8F0',
          ice: '#FFF7ED',
          saffron: '#FFF0DB',
        },
        surface: {
          50: '#FFFCF8',
          100: '#FFF8F0',
          200: '#FFF0E0',
          300: '#FFE6CC',
        },
        brand: {
          50: '#FFFBF0',
          100: '#FFF3DB',
          200: '#FFE4B5',
          300: '#FFD08A',
          400: '#FFBC5E',
          500: '#FF9933',
          600: '#E88526',
          700: '#CC7219',
          800: '#995610',
          900: '#663A0A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(153, 86, 16, 0.07)',
        'glass-lg': '0 12px 48px 0 rgba(153, 86, 16, 0.1)',
        'pastel': '0 4px 24px 0 rgba(255, 153, 51, 0.12)',
        'pastel-lg': '0 8px 40px 0 rgba(255, 153, 51, 0.18)',
        'glow': '0 0 20px rgba(255, 153, 51, 0.2)',
      },
      backgroundImage: {
        'gradient-pastel': 'linear-gradient(135deg, #FFF3DB 0%, #FFE4B5 30%, #FFD08A 60%, #FFBC5E 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #663A0A 0%, #995610 40%, #CC7219 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,243,219,0.5) 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
