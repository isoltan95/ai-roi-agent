/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'npc-maroon': '#8B172E',
        'npc-maroon-light': '#A01F38',
        'npc-navy': '#0D1B3E',
        'npc-navy-light': '#162252',
        'npc-gold': '#C9A02B',
        'ai-purple': '#6366F1',
        'ai-cyan': '#06B6D4',
        'ai-violet': '#A855F7',
        surface: '#0D1B2E',
        'surface-light': '#112240',
        'surface-card': 'rgba(255,255,255,0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #050b1a 0%, #0d1b3e 50%, #1a0a2e 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(6,182,212,0.05) 100%)',
        'accent-gradient': 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
        'maroon-gradient': 'linear-gradient(135deg, #8B172E 0%, #C9A02B 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      boxShadow: {
        'glow-purple': '0 0 30px rgba(99,102,241,0.3)',
        'glow-cyan': '0 0 30px rgba(6,182,212,0.3)',
        'glow-maroon': '0 0 30px rgba(139,23,46,0.4)',
        'card': '0 8px 32px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
