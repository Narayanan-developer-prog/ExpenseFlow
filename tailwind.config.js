/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0f1117',
          card: '#171a23',
          hover: '#1e2230',
        },
        border: {
          subtle: '#262a36',
        },
        accent: {
          purple: '#6c5ce7',
          teal: '#00d4a0',
        },
      },
      borderRadius: {
        xl: '12px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
