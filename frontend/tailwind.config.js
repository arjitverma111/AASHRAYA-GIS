/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          950: '#060913',
          900: '#0b1120',
          850: '#11182d',
          800: '#17223b',
          700: '#233254',
          600: '#344773',
          500: '#4d6599'
        },
        ndrf: {
          red: '#dc2626',
          orange: '#ea580c',
          amber: '#d97706',
          yellow: '#ca8a04',
          green: '#16a34a',
          cyan: '#0891b2',
          blue: '#2563eb'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
