import createMDX from '@next/mdx'

const isDev = process.env.NODE_ENV === 'development'

const cspDirectives = [
	"default-src 'self'",
	`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data:",
	"font-src 'self'",
	"connect-src 'self'",
	"frame-ancestors 'none'",
]

/** @type {import('next').NextConfig} */
const nextConfig = {
	pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
	turbopack: {
		resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
	},
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{ key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'X-Frame-Options', value: 'DENY' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					{
						key: 'Permissions-Policy',
						value: 'camera=(), microphone=(), geolocation=()',
					},
					{ key: 'X-DNS-Prefetch-Control', value: 'on' },
				],
			},
		]
	},
}

const withMDX = createMDX()

export default withMDX(nextConfig)
