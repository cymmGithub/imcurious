'use client'

import { motion } from 'framer-motion'
import type { CdnState } from './types'
import { CDN_BOX } from './geometry'

interface CdnActorProps {
	cdn: CdnState
	// Present from stage 1 but translucent until the SSG stage introduces it —
	// adding an actor mid-post would break scene persistence.
	dimmed: boolean
}

function EntrySlot({ entry }: { entry: CdnState['entry'] }) {
	const { cx, cy } = CDN_BOX
	const docX = cx + 24
	const docY = cy - 14

	if (entry === 'none') {
		return (
			<rect
				x={docX}
				y={docY}
				width={22}
				height={28}
				rx={3}
				fill="none"
				stroke="var(--color-chalk-faint)"
				strokeWidth={1.2}
				strokeDasharray="4 4"
				opacity={0.7}
			/>
		)
	}

	const isFresh = entry === 'fresh'
	const accent = isFresh ? '#22c55e' : '#f59e0b'

	return (
		<g>
			<rect
				x={docX}
				y={docY}
				width={22}
				height={28}
				rx={3}
				fill="var(--color-surface-card)"
				stroke={accent}
				strokeWidth={1.4}
			/>
			{[7, 13, 19].map((dy) => (
				<line
					key={dy}
					x1={docX + 4}
					x2={docX + 18 - (dy === 19 ? 6 : 0)}
					y1={docY + dy}
					y2={docY + dy}
					stroke="var(--color-chalk-dim)"
					strokeWidth={1.4}
					strokeLinecap="round"
					opacity={0.7}
				/>
			))}
			{isFresh ? (
				<circle cx={docX + 22} cy={docY} r={4} fill={accent} />
			) : (
				// freshness-timer: a tiny expired clock
				<g>
					<circle
						cx={docX + 22}
						cy={docY}
						r={6}
						fill="var(--color-surface)"
						stroke={accent}
						strokeWidth={1.4}
					/>
					<line
						x1={docX + 22}
						y1={docY}
						x2={docX + 22}
						y2={docY - 3.5}
						stroke={accent}
						strokeWidth={1.2}
						strokeLinecap="round"
					/>
					<line
						x1={docX + 22}
						y1={docY}
						x2={docX + 25}
						y2={docY + 1.5}
						stroke={accent}
						strokeWidth={1.2}
						strokeLinecap="round"
					/>
				</g>
			)}
		</g>
	)
}

export function CdnActor({ cdn, dimmed }: CdnActorProps) {
	const { cx, cy, width, height } = CDN_BOX
	const x = cx - width / 2
	const y = cy - height / 2

	return (
		<motion.g
			initial={false}
			animate={{ opacity: dimmed ? 0.22 : 1 }}
			transition={{ duration: 0.5 }}
		>
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
			{/* globe icon */}
			<g
				stroke="var(--color-chalk)"
				strokeWidth={1.2}
				fill="none"
				opacity={0.9}
			>
				<circle cx={cx - 28} cy={cy} r={16} />
				<ellipse cx={cx - 28} cy={cy} rx={7} ry={16} />
				<line x1={cx - 44} x2={cx - 12} y1={cy - 5.5} y2={cy - 5.5} />
				<line x1={cx - 44} x2={cx - 12} y1={cy + 5.5} y2={cy + 5.5} />
			</g>

			<EntrySlot entry={cdn.entry} />

			<text
				x={cx}
				y={y + height + 20}
				textAnchor="middle"
				fontSize={16}
				fontFamily="var(--font-sketch, ui-sans-serif, sans-serif)"
				fontWeight={600}
				fill="var(--color-chalk)"
				letterSpacing="0.04em"
			>
				CDN
			</text>
			{cdn.note && (
				<text
					x={cx}
					y={y - 10}
					textAnchor="middle"
					fontSize={10}
					fontFamily="var(--font-mono, ui-monospace, monospace)"
					fontStyle="italic"
					fill="var(--color-chalk-dim)"
				>
					{cdn.note}
				</text>
			)}
		</motion.g>
	)
}
