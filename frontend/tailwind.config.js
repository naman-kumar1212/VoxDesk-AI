/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stripe Foundation Palette
        app: '#F8FAFD', // --stripe-mist
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F6F9FC', // --surface-100
          muted: '#ECF0F4', // --surface-200
          soft: '#FCFDFE', // --stripe-mist-soft
          50: '#FAFDFF',
        },
        border: {
          DEFAULT: '#E3ECF7', // --border-soft
          soft: '#E3ECF7',
          mid: '#D4DEE9', // --border-mid
          strong: '#D4DEE9',
        },
        // Stripe Brand & Primary Accents
        brand: {
          DEFAULT: '#533AFD', // --stripe-violet-bright
          hover: '#635BFF', // --stripe-violet
          deep: '#7232F1',
          subtle: '#F2F0FE',
          violet: '#635BFF',
          blue: '#0073E6',
          elements: '#0570DE',
        },
        stripe: {
          white: '#FFFFFF',
          mist: '#F8FAFD',
          ink: '#061B31',
          text: '#30313D',
          violet: '#635BFF',
          'violet-bright': '#533AFD',
          'violet-deep': '#7232F1',
          indigo: '#1318C1',
          blue: '#0073E6',
          'elements-blue': '#0570DE',
          success: '#00D66F',
          orange: '#FF6118',
          pink: '#FB76FA',
          yellow: '#FFCF5E',
          danger: '#DF1B41',
        },
        voice: {
          DEFAULT: '#533AFD',
          hover: '#635BFF',
          subtle: '#F2F0FE',
          teal: '#0570DE',
        },
        sidebar: {
          DEFAULT: '#061B31', // --stripe-ink
          surface: '#0F2642',
          text: '#D4DEE9',
          active: '#1C3558',
          indicator: '#635BFF',
        },
        danger: {
          DEFAULT: '#DF1B41', // --stripe-danger
          hover: '#C01334',
          subtle: '#FFF1F3',
        },
        ink: {
          900: '#061B31',
          800: '#1C1E54',
          700: '#2B408A',
          600: '#453BB3',
          DEFAULT: '#061B31',
        },
        primary: {
          50: '#F2F0FE',
          100: '#E5E3FE',
          200: '#CBC7FD',
          300: '#ABA4FC',
          400: '#8379FB',
          500: '#635BFF',
          600: '#533AFD',
          700: '#4329D9',
          800: '#341FB5',
          900: '#1C1E54',
          950: '#061B31',
        },
      },
      fontFamily: {
        sans: [
          'Sohne',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'Source Code Pro',
          'SF Mono',
          'JetBrains Mono',
          'Roboto Mono',
          'Menlo',
          'monospace',
        ],
      },
      boxShadow: {
        xs: '0 1px 3px rgba(13, 23, 56, 0.06)',
        sm: '0 8px 20px rgba(13, 23, 56, 0.12)', // --shadow-sm
        md: '0 18px 40px rgba(13, 23, 56, 0.15)', // --shadow-md
        lg: '0 28px 60px rgba(13, 23, 56, 0.18)', // --shadow-lg
        focus: '0 0 0 3px rgba(5, 112, 222, 0.2)', // --shadow-focus
        btn: '0 8px 20px rgba(83, 58, 253, 0.24)',
        elevated: '0 18px 40px rgba(13, 23, 56, 0.15)',
      },
      borderRadius: {
        card: '18px', // Stripe 18px card radius
        input: '4px', // Stripe Elements 4px input radius
        btn: '9999px', // Stripe pill CTA button
        tag: '9999px',
        keycap: '4px',
      },
      letterSpacing: {
        tightest: '-0.04em',
        tight: '-0.02em',
        normal: '0',
        wide: '0.02em',
      },
      transitionTimingFunction: {
        'out-cubic': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
