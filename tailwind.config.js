/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "primary": "#0B4F6C",
        "accent": "#00E4FF",
        "background-dark": "#181C21",
        "surface-dark": "#1E232A",
        "text-dim": "#94b8c7"
      },
      fontFamily: {
        "display": ["Space Grotesk", "sans-serif"],
        "body": ["Plus Jakarta Sans", "sans-serif"]
      },
      animation: {
        'spin-slow': 'spin 15s linear infinite',
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(40px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } }
      }
    }
  }
}
