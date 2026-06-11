/* eslint-disable @next/next/no-img-element -- tiny inline title icons, same as the homepage */
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const iconStyle: React.CSSProperties = {
	display: 'inline',
	height: '1em',
	width: 'auto',
	verticalAlign: '-0.15em',
}

// One label per destination, defined once — posts pass hrefs and every
// title/icon change happens here only.
const NAV_LABELS: Record<string, React.ReactNode> = {
	'/the-js-event-loop-works': (
		<>
			How the{' '}
			<img
				src="/js-logo.png"
				alt="JS"
				style={{ ...iconStyle, borderRadius: '3px' }}
			/>{' '}
			Event Loop Works?
		</>
	),
	'/the-idempotency-saves-the-web': (
		<>
			How the Idempotency Saves the{' '}
			<img src="/world-wide-web.png" alt="Web" style={iconStyle} />?
		</>
	),
	'/the-browser-paints-a-web-page': (
		<>
			How the Browser <img src="/varnish.png" alt="Paints" style={iconStyle} />{' '}
			a Web Page?
		</>
	),
	'/': 'back to imcurious.how',
}

interface PostEndNavProps {
	links: string[]
}

// The post's exit point: after the Sources block, offer somewhere to go next
// instead of ending cold.
export function PostEndNav({ links }: PostEndNavProps) {
	return (
		<nav aria-label="Keep reading" className="mt-16 mb-8">
			<div
				className="font-sketch text-sm tracking-wider mb-4"
				style={{ color: 'var(--color-chalk-dim)' }}
			>
				still curious?
			</div>
			<div className="flex flex-col gap-3">
				{links.map((href) => (
					<Link
						key={href}
						href={href}
						className="group text-[var(--color-chalk)] hover:text-[var(--color-chalk)] transition-colors font-body inline-flex items-center gap-1.5 rounded-sm self-start"
					>
						<span className="relative">
							<span className="relative">{NAV_LABELS[href] ?? href}</span>
							<span className="absolute left-0 -bottom-0.5 w-0 h-px bg-chalk/60 transition-all duration-300 ease-out group-hover:w-full" />
						</span>
						<ArrowRight
							size={16}
							className="opacity-60 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-1 group-hover:opacity-100"
						/>
					</Link>
				))}
			</div>
		</nav>
	)
}
