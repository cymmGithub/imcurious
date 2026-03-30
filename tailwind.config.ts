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
          DEFAULT: 'var(--color-chalk)',
          dim: 'var(--color-chalk-dim)',
          faint: 'var(--color-chalk-faint)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          card: 'var(--color-surface-card)',
        },
        accent: 'var(--color-accent)',
      },
    },
  },
  plugins: [],
}
export default config
