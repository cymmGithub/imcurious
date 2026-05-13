'use client'

import type { WireState } from './types'
import {
	WIRE_X_END,
	WIRE_X_START,
	WIRE_Y,
	packetXFromPosition,
} from './geometry'

interface WireProps {
	wire: WireState
}

const STROKE = 'var(--color-chalk-faint)'
const TICK_STROKE = 'var(--color-chalk-faint)'
const BREAK_COLOR = '#ef4444'

const WIRE_WIDTH = 3
const TICK_HEIGHT = 5
const TICK_COUNT = 5

function tickPositions(): number[] {
	// Evenly spaced internal ticks, excluding the endpoints themselves.
	const span = WIRE_X_END - WIRE_X_START
	const step = span / (TICK_COUNT + 1)
	return Array.from(
		{ length: TICK_COUNT },
		(_, i) => WIRE_X_START + step * (i + 1),
	)
}

function WireTicks({
	visibleFrom,
	visibleTo,
}: {
	visibleFrom: number
	visibleTo: number
}) {
	return (
		<g aria-hidden="true">
			{tickPositions()
				.filter((x) => x >= visibleFrom && x <= visibleTo)
				.map((x) => (
					<line
						key={x}
						x1={x}
						x2={x}
						y1={WIRE_Y - TICK_HEIGHT}
						y2={WIRE_Y + TICK_HEIGHT}
						stroke={TICK_STROKE}
						strokeWidth={1}
						strokeLinecap="round"
						opacity={0.45}
					/>
				))}
		</g>
	)
}

export function Wire({ wire }: WireProps) {
	if (wire.healthy) {
		return (
			<g>
				<line
					x1={WIRE_X_START}
					y1={WIRE_Y}
					x2={WIRE_X_END}
					y2={WIRE_Y}
					stroke={STROKE}
					strokeWidth={WIRE_WIDTH}
					strokeLinecap="round"
				/>
				<WireTicks visibleFrom={WIRE_X_START} visibleTo={WIRE_X_END} />
			</g>
		)
	}

	const breakX = packetXFromPosition(wire.breakAt)
	const recoil = 26 // visible gap on each side of the break
	const leftEndX = breakX - recoil
	const rightEndX = breakX + recoil

	return (
		<g>
			{/* Left wire segment */}
			<line
				x1={WIRE_X_START}
				y1={WIRE_Y}
				x2={leftEndX}
				y2={WIRE_Y}
				stroke={STROKE}
				strokeWidth={WIRE_WIDTH}
				strokeLinecap="round"
			/>
			{/* Right wire segment */}
			<line
				x1={rightEndX}
				y1={WIRE_Y}
				x2={WIRE_X_END}
				y2={WIRE_Y}
				stroke={STROKE}
				strokeWidth={WIRE_WIDTH}
				strokeLinecap="round"
			/>

			<WireTicks visibleFrom={WIRE_X_START} visibleTo={leftEndX - 4} />
			<WireTicks visibleFrom={rightEndX + 4} visibleTo={WIRE_X_END} />

			{/* Left frayed end — three diverging strands */}
			<g stroke={BREAK_COLOR} strokeWidth={2} strokeLinecap="round">
				<line x1={leftEndX} y1={WIRE_Y} x2={leftEndX + 8} y2={WIRE_Y - 10} />
				<line x1={leftEndX} y1={WIRE_Y} x2={leftEndX + 11} y2={WIRE_Y - 2} />
				<line x1={leftEndX} y1={WIRE_Y} x2={leftEndX + 7} y2={WIRE_Y + 11} />
			</g>

			{/* Right frayed end — three diverging strands */}
			<g stroke={BREAK_COLOR} strokeWidth={2} strokeLinecap="round">
				<line x1={rightEndX} y1={WIRE_Y} x2={rightEndX - 8} y2={WIRE_Y - 10} />
				<line x1={rightEndX} y1={WIRE_Y} x2={rightEndX - 11} y2={WIRE_Y - 2} />
				<line x1={rightEndX} y1={WIRE_Y} x2={rightEndX - 7} y2={WIRE_Y + 11} />
			</g>

			{/* Spark / break mark — small chalk dashes scattered around the gap */}
			<g
				stroke={BREAK_COLOR}
				strokeWidth={1.2}
				strokeLinecap="round"
				opacity={0.7}
			>
				<line
					x1={breakX - 5}
					y1={WIRE_Y - 18}
					x2={breakX - 2}
					y2={WIRE_Y - 13}
				/>
				<line
					x1={breakX + 4}
					y1={WIRE_Y - 16}
					x2={breakX + 7}
					y2={WIRE_Y - 11}
				/>
				<line x1={breakX} y1={WIRE_Y + 14} x2={breakX + 3} y2={WIRE_Y + 19} />
			</g>

			{/* Annotation */}
			<text
				x={breakX}
				y={WIRE_Y - 26}
				textAnchor="middle"
				fontSize={10}
				fontFamily="var(--font-mono, ui-monospace, monospace)"
				fontStyle="italic"
				fill={BREAK_COLOR}
				letterSpacing="0.05em"
			>
				{'// connection severed'}
			</text>
		</g>
	)
}
