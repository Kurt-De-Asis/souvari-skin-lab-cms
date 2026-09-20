/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf1ee',
          100: '#f4e2dc',
          200: '#eccdc2',
          300: '#e0b3a3',
          400: '#d09a87',
          500: '#bb8875',
          600: '#a06f5f',
          700: '#82574b',
          800: '#624139',
          900: '#452d28',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        charcoal: '#000000',
        ink: '#111111',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
