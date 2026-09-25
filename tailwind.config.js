/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#5B5BD6',
        'primary-strong': '#4747C2',
        'primary-soft': '#EEEEFF',
        'primary-foreground': '#FFFFFF',
        page: '#F7F8FA',
        surface: '#FFFFFF',
        text: '#111827',
        muted: '#667085',
        border: '#E5E7EB',
        danger: '#B42318',
        success: '#067647',
        warning: '#B54708',
      },
      borderRadius: { control: '8px', card: '12px', surface: '16px' },
    },
  },
  plugins: [],
};
