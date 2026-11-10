/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Unslopped Ink & Acoustic Slate Palette
        app: '#F5F7FA',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F0F3F6',
          muted: '#ECEFF4',
        },
        border: {
          DEFAULT: '#DCE3EC',
          strong: '#C5D0DD',
        },
        brand: {
          DEFAULT: '#4338CA',
          hover: '#3730A3',
          subtle: '#EEF2FF',
        },
        voice: {
          DEFAULT: '#0F766E',
          hover: '#0D655E',
          subtle: '#F0FDF4',
        },
        sidebar: {
          DEFAULT: '#111827',
          surface: '#182338',
          text: '#C7D2E0',
          active: '#26344B',
          indicator: '#4338CA',
        },
        danger: {
          DEFAULT: '#B91C1C',
          hover: '#991B1B',
          subtle: '#FEF2F2',
        },
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4338CA',
          700: '#3730A3',
          800: '#312E81',
          900: '#1E1B4B',
          950: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px rgba(15, 23, 42, 0.05)',
        sm: '0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)',
        md: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)',
        elevated: '0 8px 24px rgba(15, 23, 42, 0.06)',
      },
      borderRadius: {
        card: '14px',
        input: '8px',
        btn: '8px',
        tag: '6px',
        keycap: '4px',
      },
      transitionTimingFunction: {
        'out-cubic': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
