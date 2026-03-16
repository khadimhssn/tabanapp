/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        taban: {
          navy: '#0A1628',
          lapis: '#1E3A5F',
          gold: '#D4A843',
          cream: '#FBF7F0',
          sand: '#E8DDD0',
          ruby: '#9B2335',
          emerald: '#2D6A4F',
        },
      },
      fontFamily: {
        dari: ['Vazirmatn', 'IRANSans', 'Noto Naskh Arabic', 'serif'],
        urdu: ['Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'serif'],
        arabic: ['Amiri', 'Noto Naskh Arabic', 'serif'],
        hindi: ['Noto Sans Devanagari', 'Poppins', 'sans-serif'],
        english: ['DM Sans', 'Source Sans 3', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'swipe-right': 'swipeRight 0.3s ease-out forwards',
        'swipe-left': 'swipeLeft 0.3s ease-out forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        swipeRight: {
          '0%': { transform: 'translateX(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateX(300px) rotate(15deg)', opacity: '0' },
        },
        swipeLeft: {
          '0%': { transform: 'translateX(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateX(-300px) rotate(-15deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
