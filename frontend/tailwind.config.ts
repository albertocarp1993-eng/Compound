import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#070b14',
          900: '#0b1220',
          850: '#111827',
          800: '#1f2937',
        },
        signal: {
          green: '#22c55e',
          yellow: '#eab308',
          red: '#ef4444',
          blue: '#38bdf8',
          gold: '#f59e0b',
        },
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 420ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
