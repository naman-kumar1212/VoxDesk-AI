/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Signal Slate & Enterprise Brand Palette
        app: '#F4F6F9',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F8FAFC',
          muted: '#EEF2F7',
        },
        border: {
          DEFAULT: '#DCE3EC',
          strong: '#C5D0DD',
        },
        brand: {
          DEFAULT: '#5B3CC4',
          hover: '#4B2FA8',
          subtle: '#F0EBFF',
        },
        voice: {
          DEFAULT: '#0F766E',
          hover: '#0D655E',
          subtle: '#E6F5F2',
        },
        sidebar: {
          DEFAULT: '#111827',
          surface: '#182338',
          text: '#C7D2E0',
          active: '#26344B',
          indicator: '#8B6CF0',
        },
        primary: {
          50: '#F0EBFF',
          100: '#E4DCFE',
          200: '#C9B8FC',
          300: '#AE95FB',
          400: '#8B6CF0',
          500: '#6E4DF4',
          600: '#5B3CC4',
          700: '#4B2FA8',
          800: '#3D248C',
          900: '#2E1970',
          950: '#1D0E4D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px rgba(15, 23, 42, 0.05)',
        sm: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        md: '0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        elevated: '0 8px 24px rgba(15, 23, 42, 0.10)',
      },
      borderRadius: {
        card: '14px',
        input: '10px',
        btn: '9px',
      },
    },
  },
  plugins: [],
}
