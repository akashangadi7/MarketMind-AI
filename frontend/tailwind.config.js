/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Toggle class 'dark' on html element
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: '#0B0F19',
          cardDark: '#131A2E',
          cardLight: '#FFFFFF',
          brandBlue: '#2563EB',
          brandCyan: '#06B6D4',
          brandPurple: '#8B5CF6',
          bgLight: '#F8FAFC',
          borderLight: '#E2E8F0',
          borderDark: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        glassDark: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
