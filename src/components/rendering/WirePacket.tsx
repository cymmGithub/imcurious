'use client'

import { motion } from 'framer-motion'
import type { PacketKind, PacketState } from './types'
import { packetPoint } from './geometry'

// Each packet kind reads differently at a glance; size differences carry
// the post's core visual argument (fat CSR bundle vs thin RSC payload).
const PACKET_STYLE: Record<
	PacketKind,
	{ fill: string; text: string; outline?: boolean }
> = {
	request: { fill: 'var(--color-chalk-dim)', text: 'REQ', outline: true },
	'html-shell': { fill: '#64748b', text: 'HTML', outline: true },
	'html-full': { fill: '#10b981', text: 'HTML' },
	'html-chunk': { fill: '#34d399', text: 'CHUNK' },
	'js-bundle': { fill: '#eab308', text: 'JS' },
	data: { fill: '#06b6d4', text: 'DATA' },
	'rsc-payload': { fill: '#a855f7', text: 'RSC' },
}

interface WirePacketProps {
	packet: PacketState
}

export function WirePacket({ packet }: WirePacketProps) {
	const { x, y } = packetPoint(packet.from, packet.to, packet.position)
	const style = PACKET_STYLE[packet.kind]
	const width = 30 + packet.size * 70
	const height = 16 + packet.size * 10

	return (
		<motion.g
			initial={false}
			animate={{ x, y }}
			transition={{ duration: 0.45, ease: 'easeInOut' }}
			style={{ pointerEvents: 'none' }}
		>
			<rect
				x={-width / 2}
				y={-height / 2}
				width={width}
				height={height}
				rx={height / 2}
				fill={style.outline ? 'var(--color-surface)' : style.fill}
				stroke={style.fill}
				strokeWidth={1.5}
				strokeDasharray={packet.kind === 'html-shell' ? '4 3' : undefined}
			/>
			<text
				x={0}
				y={3.5}
				textAnchor="middle"
				fontSize={10}
				fontFamily="var(--font-mono, ui-monospace, monospace)"
				fontWeight={600}
				fill={style.outline ? 'var(--color-chalk)' : '#0a0908'}
			>
				{style.text}
			</text>
			{packet.label && (
				<text
					x={0}
					y={height / 2 + 12}
					textAnchor="middle"
					fontSize={9}
					fontFamily="var(--font-mono, ui-monospace, monospace)"
					fontStyle="italic"
					fill="var(--color-chalk-dim)"
				>
					{packet.label}
				</text>
			)}
		</motion.g>
	)
}
