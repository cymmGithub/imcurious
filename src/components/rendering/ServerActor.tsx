'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ServerActivity, ServerState } from './types'
import { SERVER_BOX } from './geometry'

interface ServerActorProps {
	server: ServerState
}

const ACTIVITY_BADGE: Record<Exclude<ServerActivity, 'idle'>, string> = {
	rendering: 'RENDERING',
	building: 'BUILDING',
	regenerating: 'REGENERATING',
	streaming: 'STREAMING',
}

const ACTIVITY_COLOR: Record<Exclude<ServerActivity, 'idle'>, string> = {
	rendering: '#f97316',
	building: '#a855f7',
	regenerating: '#f59e0b',
	streaming: '#06b6d4',
}

function BuildClock({
	cx,
	cy,
	color,
}: {
	cx: number
	cy: number
	color: string
}) {
	const reducedMotion = useReducedMotion()
	return (
		<g>
			<circle
				cx={cx}
				cy={cy}
				r={9}
				fill="var(--color-surface)"
				stroke={color}
				strokeWidth={1.4}
			/>
			<line
				x1={cx}
				y1={cy}
				x2={cx}
				y2={cy - 5.5}
				stroke={color}
				strokeWidth={1.4}
				strokeLinecap="round"
			/>
			<motion.line
				x1={cx}
				y1={cy}
				x2={cx + 4.5}
				y2={cy}
				stroke={color}
				strokeWidth={1.4}
				strokeLinecap="round"
				initial={false}
				animate={reducedMotion ? undefined : { rotate: 360 }}
				transition={
					reducedMotion
						? undefined
						: { duration: 3, repeat: Infinity, ease: 'linear' }
				}
				style={{ originX: `${cx}px`, originY: `${cy}px` }}
			/>
		</g>
	)
}

export function ServerActor({ server }: ServerActorProps) {
	const reducedMotion = useReducedMotion()
	const { cx, cy, width, height } = SERVER_BOX
	const x = cx - width / 2
	const y = cy - height / 2
	const activity = server.activity
	const busy = activity !== 'idle'
	const color = activity === 'idle' ? '#22c55e' : ACTIVITY_COLOR[activity]

	return (
		<g>
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
			{/* two rack units */}
			{[cy - 24, cy + 2].map((unitY, i) => (
				<g key={i}>
					<rect
						x={cx - 50}
						y={unitY}
						width={100}
						height={20}
						rx={3}
						fill="var(--color-surface-card)"
						stroke="var(--color-chalk-dim)"
						strokeWidth={1}
					/>
					<motion.circle
						cx={cx - 40}
						cy={unitY + 10}
						r={2.5}
						fill={color}
						initial={false}
						animate={
							busy && !reducedMotion
								? { opacity: [1, 0.25, 1] }
								: { opacity: 1 }
						}
						transition={
							busy && !reducedMotion
								? {
										duration: 0.9,
										repeat: Infinity,
										ease: 'easeInOut',
										delay: i * 0.45,
									}
								: undefined
						}
					/>
					<line
						x1={cx - 30}
						x2={cx + 40}
						y1={unitY + 10}
						y2={unitY + 10}
						stroke="var(--color-chalk-dim)"
						strokeWidth={1}
						opacity={0.45}
					/>
				</g>
			))}

			{server.activity === 'building' && (
				<BuildClock cx={cx + 58} cy={y + 4} color={color} />
			)}

			{activity !== 'idle' && (
				<text
					x={cx}
					y={y - 10}
					textAnchor="middle"
					fontSize={10}
					fontFamily="var(--font-mono, ui-monospace, monospace)"
					fontWeight={600}
					fill={color}
					letterSpacing="0.14em"
				>
					{ACTIVITY_BADGE[activity]}
				</text>
			)}

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
				SERVER
			</text>
			{server.note && (
				<text
					x={cx}
					y={y + height + 36}
					textAnchor="middle"
					fontSize={10}
					fontFamily="var(--font-mono, ui-monospace, monospace)"
					fontStyle="italic"
					fill="var(--color-chalk-dim)"
				>
					{server.note}
				</text>
			)}
		</g>
	)
}
