/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Whiskey-inspired color palette
        primary: {
          50: '#fef9f2',
          100: '#fef0e5',
          200: '#fdddc2',
          300: '#fac594',
          400: '#f7a966', // Amber
          500: '#f58a3a', // Primary amber
          600: '#e6671d',
          700: '#c04e15',
          800: '#993f15',
          900: '#7c3516',
          950: '#431909',
        },
        secondary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047', // Golden
          400: '#facc15',
          500: '#eab308', // Gold
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        accent: {
          50: '#fdf8f2',
          100: '#fbefe1',
          200: '#f6dcbf',
          300: '#f0c394',
          400: '#e8a55e', // Bronze
          500: '#cd7f32', // Classic bronze
          600: '#a0522d', // Dark bronze
          700: '#8b4513',
          800: '#723a12',
          900: '#5d3012',
          950: '#311808',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(0, 0, 0, 0.1)',
        },
        whiskey: {
          amber: '#FFC066',
          'amber-light': '#FFB347',
          bronze: '#CD7F32',
          'bronze-dark': '#A0522D',
          gold: '#FFD700',
          'gold-dark': '#B8860B',
          caramel: '#C7941E',
          'caramel-light': '#D2B48C',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cyber-grid': 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        'glass-gradient-dark': 'linear-gradient(135deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.05))',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.8), 0 0 30px rgba(168, 85, 247, 0.5)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      fontFamily: {
        'cyber': ['Orbitron', 'monospace'],
      },
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
        '14': 'repeat(14, minmax(0, 1fr))',
        '15': 'repeat(15, minmax(0, 1fr))',
        '16': 'repeat(16, minmax(0, 1fr))',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            'display': 'none'
          }
        }
      })
    }
  ],
}