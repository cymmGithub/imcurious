'use client'

import {
	selectCurrentSnapshot,
	useIdempotencyStore,
} from '@/stores/idempotencyStore'
import { Wire } from './Wire'
import { Packet } from './Packet'
import { ResourcePanel } from './ResourcePanel'
import { RequestLog } from './RequestLog'
import { CLIENT_ANCHOR, LAB_VIEWBOX, SERVER_ANCHOR } from './geometry'

const IDLE_DESCRIPTION = 'Retry Lab idle.'

interface EndpointProps {
	anchor: typeof CLIENT_ANCHOR | typeof SERVER_ANCHOR
	title: string
	subtitle: string
	kind: 'client' | 'server'
}

function Endpoint({ anchor, title, subtitle, kind }: EndpointProps) {
	return (
		<g>
			{kind === 'client' ? (
				<ClientIcon cx={anchor.iconCx} cy={anchor.iconCy} />
			) : (
				<ServerIcon cx={anchor.iconCx} cy={anchor.iconCy} />
			)}
			<text
				x={anchor.iconCx}
				y={anchor.labelY}
				textAnchor="middle"
				fontSize={20}
				fontFamily="var(--font-sketch, ui-sans-serif, sans-serif)"
				fontWeight={600}
				fill="var(--color-chalk)"
				letterSpacing="0.04em"
			>
				{title}
			</text>
			<text
				x={anchor.iconCx}
				y={anchor.subtitleY}
				textAnchor="middle"
				fontSize={9}
				fontFamily="var(--font-mono, ui-monospace, monospace)"
				fill="var(--color-chalk-dim)"
				letterSpacing="0.18em"
			>
				{subtitle}
			</text>
		</g>
	)
}

function ClientIcon({ cx, cy }: { cx: number; cy: number }) {
	return (
		<g>
			{/* monitor outer frame */}
			<rect
				x={cx - 22}
				y={cy - 16}
				width={44}
				height={30}
				rx={3}
				fill="var(--color-surface)"
				stroke="var(--color-chalk)"
				strokeWidth={1.5}
			/>
			{/* faint screen content lines */}
			<line
				x1={cx - 14}
				x2={cx + 14}
				y1={cy - 8}
				y2={cy - 8}
				stroke="var(--color-chalk-dim)"
				strokeWidth={1}
				opacity={0.55}
			/>
			<line
				x1={cx - 14}
				x2={cx + 8}
				y1={cy - 2}
				y2={cy - 2}
				stroke="var(--color-chalk-dim)"
				strokeWidth={1}
				opacity={0.55}
			/>
			<line
				x1={cx - 14}
				x2={cx + 12}
				y1={cy + 4}
				y2={cy + 4}
				stroke="var(--color-chalk-dim)"
				strokeWidth={1}
				opacity={0.55}
			/>
			{/* stand neck */}
			<line
				x1={cx}
				x2={cx}
				y1={cy + 14}
				y2={cy + 19}
				stroke="var(--color-chalk)"
				strokeWidth={2}
			/>
			{/* stand base */}
			<line
				x1={cx - 9}
				x2={cx + 9}
				y1={cy + 20}
				y2={cy + 20}
				stroke="var(--color-chalk)"
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</g>
	)
}

function ServerIcon({ cx, cy }: { cx: number; cy: number }) {
	return (
		<g>
			{/* top server unit */}
			<rect
				x={cx - 22}
				y={cy - 16}
				width={44}
				height={14}
				rx={2}
				fill="var(--color-surface)"
				stroke="var(--color-chalk)"
				strokeWidth={1.5}
			/>
			<circle cx={cx - 15} cy={cy - 9} r={1.8} fill="#22c55e" />
			<line
				x1={cx - 8}
				x2={cx + 16}
				y1={cy - 9}
				y2={cy - 9}
				stroke="var(--color-chalk-dim)"
				strokeWidth={1}
				opacity={0.45}
			/>
			{/* bottom server unit */}
			<rect
				x={cx - 22}
				y={cy}
				width={44}
				height={14}
				rx={2}
				fill="var(--color-surface)"
				stroke="var(--color-chalk)"
				strokeWidth={1.5}
			/>
			<circle cx={cx - 15} cy={cy + 7} r={1.8} fill="#f97316" />
			<line
				x1={cx - 8}
				x2={cx + 16}
				y1={cy + 7}
				y2={cy + 7}
				stroke="var(--color-chalk-dim)"
				strokeWidth={1}
				opacity={0.45}
			/>
		</g>
	)
}

export function RetryLabViz() {
	const activeScenarioId = useIdempotencyStore((s) => s.activeScenarioId)
	const snapshot = useIdempotencyStore(selectCurrentSnapshot)

	return (
		<div
			className="relative w-full h-full flex flex-col"
			role="img"
			aria-label="Retry Lab — animated diagram of a client, server, and the wire between them. Shows requests and responses traveling across HTTP, including failure modes."
		>
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{snapshot && activeScenarioId ? snapshot.description : IDLE_DESCRIPTION}
			</div>

			<div className="relative flex-1 min-h-[140px] lg:min-h-[200px] flex items-center justify-center px-2 pt-2">
				<svg
					viewBox={LAB_VIEWBOX}
					className="w-full h-full max-h-full"
					preserveAspectRatio="xMidYMid meet"
				>
					<Endpoint
						anchor={CLIENT_ANCHOR}
						title="CLIENT"
						subtitle="YOUR CODE"
						kind="client"
					/>
					<Endpoint
						anchor={SERVER_ANCHOR}
						title="SERVER"
						subtitle="THE API"
						kind="server"
					/>
					<Wire wire={snapshot?.wire ?? { healthy: true }} />
					{snapshot?.packets.map((packet) => (
						<Packet key={packet.id} packet={packet} />
					))}
				</svg>
			</div>

			<div className="grid grid-cols-2 gap-3 p-3 pt-1 h-[45%] min-h-[140px] lg:min-h-[200px]">
				<RequestLog log={snapshot?.log ?? []} />
				<ResourcePanel resource={snapshot?.resource ?? { kind: 'none' }} />
			</div>
		</div>
	)
}
