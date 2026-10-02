/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // The neutral scale is the night sky after a hot day: violet-tinted, so the
        // warm heat colours are the only strong chroma on screen.
        slate: {
          50: '#f6f4fa',
          100: '#ece8f3',
          200: '#d9d3e6',
          300: '#bcb3cf',
          400: '#978dae',
          500: '#7c7396',
          600: '#514a68',
          700: '#3a3450',
          800: '#28233a',
          900: '#1a1728',
          950: '#0f0d1a',
        },
        base: '#0f0d1a',
        surface: '#1a1728',
        elevated: '#28233a',
        border: '#3a3450',
        'border-subtle': '#28233a',
      },
      fontFamily: {
        sans: ['"Anek Latin"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
