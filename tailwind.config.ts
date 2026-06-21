import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
            DEFAULT: '#7c3aed',
            light: '#a78bfa',
            dark: '#5b21b6',
          },
      },
    },
  },
  plugins: [],
}

export default config
