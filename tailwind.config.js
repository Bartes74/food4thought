/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/client/index.html",
    "./src/client/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#006575',
          light: '#008299',
          dark: '#004d5c'
        },
        // Kolory dla dark mode - poprawione dla lepszego kontrastu
        dark: {
          bg: '#1a202c', // ciemniejsze tło
          surface: '#2d3748', // jaśniejsza powierzchnia
          border: '#4a5568', // granica
          text: '#f7fafc', // główny tekst
          textSecondary: '#e2e8f0', // tekst drugorzędny
          textMuted: '#a0aec0' // tekst stłumiony
        },
        // Kolory dla light mode - poprawione dla lepszego kontrastu
        light: {
          bg: '#ffffff', // czystsze białe tło
          surface: '#f8fafc', // jaśniejsze tło powierzchni
          border: '#d1d5db', // ciemniejsza granica
          text: '#0f172a', // ciemniejszy główny tekst
          textSecondary: '#475569', // ciemniejszy tekst drugorzędny
          textMuted: '#64748b' // ciemniejszy tekst stłumiony
        }
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}