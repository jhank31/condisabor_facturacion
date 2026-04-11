/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#031636',
        'primary-container': '#1a2b4c',
        'on-primary': '#ffffff',
        'on-primary-container': '#8293ba',
        'on-primary-fixed': '#071b3b',
        'on-primary-fixed-variant': '#364669',
        'primary-fixed': '#d8e2ff',
        'primary-fixed-dim': '#b6c6f0',
        'inverse-primary': '#b6c6f0',

        secondary: '#914d00',
        'secondary-container': '#fc9430',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#663500',
        'on-secondary-fixed': '#2f1500',
        'on-secondary-fixed-variant': '#6e3900',
        'secondary-fixed': '#ffdcc3',
        'secondary-fixed-dim': '#ffb77d',

        tertiary: '#241300',
        'tertiary-container': '#3f2600',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#b28c5b',
        'on-tertiary-fixed': '#2a1800',
        'on-tertiary-fixed-variant': '#5e4117',
        'tertiary-fixed': '#ffddb5',
        'tertiary-fixed-dim': '#eabf8a',

        surface: '#f8f9fa',
        'surface-bright': '#f8f9fa',
        'surface-dim': '#d9dadb',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f4f5',
        'surface-container': '#edeeef',
        'surface-container-high': '#e7e8e9',
        'surface-container-highest': '#e1e3e4',
        'surface-variant': '#e1e3e4',
        'surface-tint': '#4e5e82',

        background: '#f8f9fa',
        'on-surface': '#191c1d',
        'on-surface-variant': '#44474e',
        'on-background': '#191c1d',

        'inverse-surface': '#2e3132',
        'inverse-on-surface': '#f0f1f2',

        outline: '#75777f',
        'outline-variant': '#c5c6cf',

        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      fontFamily: {
        headline: ['Montserrat', 'Plus Jakarta Sans', 'sans-serif'],
        body: ['Mulish', 'Manrope', 'sans-serif'],
        label: ['Mulish', 'Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
