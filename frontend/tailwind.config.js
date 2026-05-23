/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#252338',
        muted: '#706f86',
        line: '#e4def5',
        panel: '#f8f6ff',
        accent: '#7c3aed',
        focus: '#3b82f6',
        blush: '#fff1f8',
        skywash: '#e9f7ff',
        lavender: '#ebe8ff',
        warn: '#b45309',
        danger: '#b91c1c'
      },
      boxShadow: {
        soft: '0 18px 48px rgba(91, 84, 140, 0.16)',
        card: '0 10px 28px rgba(103, 95, 150, 0.11)'
      }
    }
  },
  plugins: []
};
