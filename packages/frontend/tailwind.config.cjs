module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'brand-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'header-gradient': 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        'success-gradient': 'linear-gradient(135deg, #10b981, #059669)',
        'warning-gradient': 'linear-gradient(135deg, #f59e0b, #d97706)',
        'danger-gradient': 'linear-gradient(135deg, #ef4444, #dc2626)',
        'info-gradient': 'linear-gradient(135deg, #3b82f6, #2563eb)',
        'purple-gradient': 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        'cyan-gradient': 'linear-gradient(135deg, #06b6d4, #0891b2)',
        'glass': 'rgba(255, 255, 255, 0.95)',
        'glass-dark': 'rgba(255, 255, 255, 0.85)',
      },
      backdropBlur: {
        'xs': '2px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      boxShadow: {
        'glass': '0 20px 40px rgba(0, 0, 0, 0.1)',
        'glass-sm': '0 10px 30px rgba(0, 0, 0, 0.08)',
        'colored': '0 8px 32px rgba(79, 70, 229, 0.3)',
        'success': '0 8px 32px rgba(16, 185, 129, 0.3)',
        'warning': '0 8px 32px rgba(245, 158, 11, 0.3)',
        'danger': '0 8px 32px rgba(239, 68, 68, 0.3)',
        'hover': '0 12px 40px rgba(16, 185, 129, 0.4)',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: []
};