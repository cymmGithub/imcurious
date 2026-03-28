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
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
        'space-mono': ['var(--font-space-mono)', 'monospace'],
      },
      colors: {
        neon: {
          cyan: '#00f5ff',
          pink: '#ff006e',
          yellow: '#ffbe0b',
          green: '#06d6a0',
        },
        track: {
          surface: '#1a1a2e',
          line: '#4a4a6a',
        },
      },
    },
  },
  plugins: [],
}
export default config
