/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'background-light': '#f7f9fc',
        'background-dark': '#121212',
        'card-light': '#ffffff',
        'card-dark': '#1e1e1e',
        'text-light': '#1f2937',
        'text-dark': '#e5e7eb',
        'text-muted-light': '#6b7280',
        'text-muted-dark': '#9ca3af',
        'primary': {
          DEFAULT: '#3b82f6',
          'light': '#60a5fa',
          'dark': '#2563eb',
        },
        'accent': {
          DEFAULT: '#8b5cf6',
          'light': '#a78bfa',
          'dark': '#7c3aed',
        },
      },
    },
  },
  plugins: [],
}
