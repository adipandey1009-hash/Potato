/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        potato: {
          bg: '#F4F1E8',
          surface: '#FFFEFA',
          ink: '#171914',
          muted: '#64675D',
          olive: '#303B2C',
          lime: '#D8F36A',
          border: '#E1E0D6',
          success: '#287A4B',
          warning: '#A96512',
          error: '#B42318',
          info: '#2859A5',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      }
    },
  },
  plugins: [],
}
