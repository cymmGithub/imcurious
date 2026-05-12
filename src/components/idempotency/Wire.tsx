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
const BREAK_COLOR = '#ef4444'

export function Wire({ wire }: WireProps) {
	if (wire.healthy) {
		return (
			<line
				x1={WIRE_X_START}
				y1={WIRE_Y}
				x2={WIRE_X_END}
				y2={WIRE_Y}
				stroke={STROKE}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		)
	}

	const breakX = packetXFromPosition(wire.breakAt)
	const halfGap = 18

	return (
		<g>
			<line
				x1={WIRE_X_START}
				y1={WIRE_Y}
				x2={breakX - halfGap}
				y2={WIRE_Y}
				stroke={STROKE}
				strokeWidth={2}
				strokeLinecap="round"
			/>
			<line
				x1={breakX + halfGap}
				y1={WIRE_Y}
				x2={WIRE_X_END}
				y2={WIRE_Y}
				stroke={STROKE}
				strokeWidth={2}
				strokeLinecap="round"
			/>

			{/* Left frayed end */}
			<line
				x1={breakX - halfGap}
				y1={WIRE_Y}
				x2={breakX - halfGap + 6}
				y2={WIRE_Y - 8}
				stroke={BREAK_COLOR}
				strokeWidth={2}
				strokeLinecap="round"
			/>
			<line
				x1={breakX - halfGap}
				y1={WIRE_Y}
				x2={breakX - halfGap + 4}
				y2={WIRE_Y + 9}
				stroke={BREAK_COLOR}
				strokeWidth={2}
				strokeLinecap="round"
			/>

			{/* Right frayed end */}
			<line
				x1={breakX + halfGap}
				y1={WIRE_Y}
				x2={breakX + halfGap - 6}
				y2={WIRE_Y - 8}
				stroke={BREAK_COLOR}
				strokeWidth={2}
				strokeLinecap="round"
			/>
			<line
				x1={breakX + halfGap}
				y1={WIRE_Y}
				x2={breakX + halfGap - 4}
				y2={WIRE_Y + 9}
				stroke={BREAK_COLOR}
				strokeWidth={2}
				strokeLinecap="round"
			/>

			{/* Small "break" indicator */}
			<text
				x={breakX}
				y={WIRE_Y - 18}
				textAnchor="middle"
				fontSize={10}
				fontFamily="var(--font-mono, monospace)"
				fill={BREAK_COLOR}
				fontWeight={600}
			>
				broken
			</text>
		</g>
	)
}
