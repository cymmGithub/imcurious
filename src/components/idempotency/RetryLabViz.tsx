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
}

function LabelledBox({ box, title, subtitle }: LabelledBoxProps) {
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
				x={box.x + box.width / 2}
				y={box.labelY}
				textAnchor="middle"
				fontSize={14}
				fontFamily="var(--font-sketch, ui-sans-serif, sans-serif)"
				fontWeight={600}
				fill="var(--color-chalk)"
			>
				{title}
			</text>
			<text
				x={box.x + box.width / 2}
				y={box.y + box.height / 2 + 4}
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

			<div className="relative flex-1 min-h-[200px] flex items-center justify-center px-2 pt-2">
				<svg
					viewBox={LAB_VIEWBOX}
					className="w-full h-full max-h-full"
					preserveAspectRatio="xMidYMid meet"
				>
					<LabelledBox box={CLIENT_BOX} title="Client" subtitle="your code" />
					<LabelledBox box={SERVER_BOX} title="Server" subtitle="the API" />
					<Wire wire={snapshot?.wire ?? { healthy: true }} />
					{snapshot?.packets.map((packet) => (
						<Packet key={packet.id} packet={packet} />
					))}
				</svg>
			</div>

			<div className="grid grid-cols-2 gap-3 p-3 pt-1 h-[45%] min-h-[200px]">
				<RequestLog log={snapshot?.log ?? []} />
				<ResourcePanel resource={snapshot?.resource ?? { kind: 'none' }} />
			</div>
		</div>
	)
}
