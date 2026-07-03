/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'rgba(255, 255, 255, 0.08)',
        background: '#030712',
        foreground: '#f9fafb',
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          foreground: '#ffffff',
        },
        card: {
          DEFAULT: 'rgba(15, 23, 42, 0.6)',
          foreground: '#f9fafb',
        },
        muted: {
          DEFAULT: 'rgba(255, 255, 255, 0.04)',
          foreground: '#9ca3af',
        }
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
