import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          blue: '#007BFF',
          'dark-blue': '#0066E8',
          glow: '#00A8FF',
        },
        dark: {
          bg: '#0B0F1A',
          'bg-secondary': '#101827',
        },
        silver: {
          light: '#F5F7FA',
          muted: '#D9DDE4',
        },
      },
      backgroundImage: {
        'gradient-blue': 'linear-gradient(135deg, #007BFF 0%, #0066E8 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0B0F1A 0%, #101827 100%)',
        'gradient-glow': 'linear-gradient(135deg, #007BFF 0%, #00A8FF 100%)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0, 168, 255, 0.3)',
        'glow-blue-md': '0 0 40px rgba(0, 168, 255, 0.5)',
        'glow-blue-lg': '0 0 60px rgba(0, 168, 255, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
export default config
