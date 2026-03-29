import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/posts/**/*.{mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sketch: ['var(--font-sketch)', 'cursive'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        chalk: {
          DEFAULT: '#e8e4dc',
          dim: '#a09a8e',
          faint: '#5a554d',
        },
        surface: {
          DEFAULT: '#000000',
          card: '#0a0a0a',
        },
        accent: '#c0b8a8',
      },
    },
  },
  plugins: [],
}
export default config
