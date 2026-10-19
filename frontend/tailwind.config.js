/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A2540',
          hover: '#071B2F',
        },
        sky: {
          DEFAULT: '#00A8E8',
          hover: '#0092CB',
          light: '#E6F6FD',
        },
        paper: '#F7FAFC',
        safe: {
          DEFAULT: '#15803D',
          light: '#DCFCE7',
        },
        lost: {
          DEFAULT: '#C2540A',
          light: '#FFEDD5',
        },
        line: '#E2E8F0',
        muted: '#5B6B7C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(10, 37, 64, 0.06)',
        lift: '0 12px 30px -4px rgba(10, 37, 64, 0.1)',
      },
    },
  },
  plugins: [],
}
