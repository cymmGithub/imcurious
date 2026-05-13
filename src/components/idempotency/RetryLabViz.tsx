'use client'

import {
	selectCurrentSnapshot,
	useIdempotencyStore,
} from '@/stores/idempotencyStore'
import { Wire } from './Wire'
import { Packet } from './Packet'
import { ResourcePanel } from './ResourcePanel'
import { RequestLog } from './RequestLog'
import { CLIENT_BOX, LAB_VIEWBOX, SERVER_BOX } from './geometry'

const IDLE_DESCRIPTION = 'Retry Lab idle.'

interface LabelledBoxProps {
	box: typeof CLIENT_BOX | typeof SERVER_BOX
	title: string
	subtitle: string
	kind: 'client' | 'server'
}

function LabelledBox({ box, title, subtitle, kind }: LabelledBoxProps) {
	const cx = box.x + box.width / 2
	const iconCY = box.y + 38
	const subtitleY = box.y + box.height - 16

	return (
		<g>
			<rect
				x={box.x}
				y={box.y}
				width={box.width}
				height={box.height}
				rx={6}
				fill="var(--color-surface-card)"
				stroke="var(--color-chalk-faint)"
				strokeWidth={1.5}
			/>
			<text
				x={cx}
				y={box.labelY}
				textAnchor="middle"
				fontSize={14}
				fontFamily="var(--font-sketch, ui-sans-serif, sans-serif)"
				fontWeight={600}
				fill="var(--color-chalk)"
			>
				{title}
			</text>
			{kind === 'client' ? (
				<ClientIcon cx={cx} cy={iconCY} />
			) : (
				<ServerIcon cx={cx} cy={iconCY} />
			)}
			<text
				x={cx}
				y={subtitleY}
				textAnchor="middle"
				fontSize={11}
				fontFamily="var(--font-mono, ui-monospace, monospace)"
				fill="var(--color-chalk-dim)"
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
					<LabelledBox
						box={CLIENT_BOX}
						title="Client"
						subtitle="your code"
						kind="client"
					/>
					<LabelledBox
						box={SERVER_BOX}
						title="Server"
						subtitle="the API"
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
