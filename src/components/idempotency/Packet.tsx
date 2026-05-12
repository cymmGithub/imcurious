'use client'

import { motion } from 'framer-motion'
import type { HttpMethod, PacketState } from './types'
import { WIRE_Y, packetXFromPosition } from './geometry'

const METHOD_COLORS: Record<HttpMethod, string> = {
	GET: '#14b8a6',
	POST: '#f97316',
	PUT: '#3b82f6',
	PATCH: '#a855f7',
	DELETE: '#ef4444',
}

const STATUS_FAMILY_COLOR: Record<number, string> = {
	2: '#10b981',
	3: '#06b6d4',
	4: '#f59e0b',
	5: '#ef4444',
}

function statusColor(status: number): string {
	return STATUS_FAMILY_COLOR[Math.floor(status / 100)] ?? '#6b7280'
}

interface PacketProps {
	packet: PacketState
}

const PACKET_WIDTH = 96
const PACKET_HEIGHT = 26

export function Packet({ packet }: PacketProps) {
	const x = packetXFromPosition(packet.position)
	const fill =
		packet.kind === 'request'
			? METHOD_COLORS[packet.method]
			: statusColor(packet.statusCode)
	const displayText = packet.kind === 'request' ? packet.method : packet.label
	const opacity = packet.fate === 'lost' ? 0.35 : 1
	// Requests sit above the wire, responses below — so direction reads even
	// without watching the motion.
	const y = WIRE_Y + (packet.kind === 'request' ? -22 : 22)
	const isLost = packet.fate === 'lost'

	return (
		<motion.g
			initial={false}
			animate={{ x, y, opacity }}
			transition={{ duration: 0.45, ease: 'easeInOut' }}
			style={{ pointerEvents: 'none' }}
		>
			<rect
				x={-PACKET_WIDTH / 2}
				y={-PACKET_HEIGHT / 2}
				width={PACKET_WIDTH}
				height={PACKET_HEIGHT}
				rx={PACKET_HEIGHT / 2}
				fill={fill}
				stroke={isLost ? '#ef4444' : 'none'}
				strokeWidth={isLost ? 1.5 : 0}
				strokeDasharray={isLost ? '3 3' : undefined}
			/>
			<text
				x={0}
				y={4}
				textAnchor="middle"
				fontSize={11}
				fontFamily="var(--font-mono, ui-monospace, monospace)"
				fontWeight={600}
				fill="white"
			>
				{displayText}
			</text>

			<polygon
				points={
					packet.kind === 'request'
						? `${PACKET_WIDTH / 2 + 4},-4 ${PACKET_WIDTH / 2 + 12},0 ${PACKET_WIDTH / 2 + 4},4`
						: `${-PACKET_WIDTH / 2 - 4},-4 ${-PACKET_WIDTH / 2 - 12},0 ${-PACKET_WIDTH / 2 - 4},4`
				}
				fill={fill}
				opacity={isLost ? 0.4 : 0.8}
			/>
		</motion.g>
	)
}
