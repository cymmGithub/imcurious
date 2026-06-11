'use client'

import type { BrowserState } from './types'
import { BROWSER_BOX, BROWSER_CHROME_HEIGHT, SKELETON } from './geometry'
import { PageSkeleton } from './PageSkeleton'

interface BrowserActorProps {
	browser: BrowserState
}

export function BrowserActor({ browser }: BrowserActorProps) {
	const { x, y, width, height } = BROWSER_BOX
	return (
		<g>
			{/* window frame */}
			<rect
				x={x}
				y={y}
				width={width}
				height={height}
				rx={8}
				fill="var(--color-surface)"
				stroke="var(--color-chalk)"
				strokeWidth={1.5}
			/>
			{/* chrome bar */}
			<line
				x1={x}
				x2={x + width}
				y1={y + BROWSER_CHROME_HEIGHT}
				y2={y + BROWSER_CHROME_HEIGHT}
				stroke="var(--color-chalk-faint)"
				strokeWidth={1}
			/>
			{[0, 1, 2].map((i) => (
				<circle
					key={i}
					cx={x + 14 + i * 12}
					cy={y + BROWSER_CHROME_HEIGHT / 2}
					r={3.5}
					fill="none"
					stroke="var(--color-chalk-dim)"
					strokeWidth={1}
				/>
			))}
			{/* status note doubles as the URL-bar text */}
			{browser.note && (
				<text
					x={x + 52}
					y={y + BROWSER_CHROME_HEIGHT / 2 + 3.5}
					fontSize={10}
					fontFamily="var(--font-mono, ui-monospace, monospace)"
					fontStyle="italic"
					fill="var(--color-chalk-dim)"
				>
					{browser.note}
				</text>
			)}

			<PageSkeleton blocks={browser.blocks} x={SKELETON.x} y={SKELETON.y} />

			<text
				x={x + width / 2}
				y={y + height + 22}
				textAnchor="middle"
				fontSize={16}
				fontFamily="var(--font-sketch, ui-sans-serif, sans-serif)"
				fontWeight={600}
				fill="var(--color-chalk)"
				letterSpacing="0.04em"
			>
				BROWSER
			</text>
		</g>
	)
}
