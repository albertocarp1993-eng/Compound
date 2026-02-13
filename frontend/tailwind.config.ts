import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        snow: {
          50: '#f8fafc',
          100: '#f1f5f9',
          600: '#334155',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
