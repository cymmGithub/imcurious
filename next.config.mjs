import createMDX from '@next/mdx'
import rehypePrettyCode from 'rehype-pretty-code'

/** @type {import('rehype-pretty-code').Options} */
const prettyCodeOptions = {
  theme: { dark: 'nord', light: 'github-light' },
  keepBackground: false,
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  turbopack: {
    resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
}

const withMDX = createMDX({
  options: {
    rehypePlugins: [['rehype-pretty-code', prettyCodeOptions]],
  },
})

export default withMDX(nextConfig)
