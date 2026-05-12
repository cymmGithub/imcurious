'use client'

import { useShallow } from 'zustand/react/shallow'
import {
	selectCurrentSnapshot,
	useIdempotencyStore,
} from '@/stores/idempotencyStore'
import { Client } from './Client'
import { Server } from './Server'
import { Wire } from './Wire'
import { Packet } from './Packet'
import { ResourcePanel } from './ResourcePanel'
import { RequestLog } from './RequestLog'
import { LAB_VIEWBOX } from './geometry'
import type { Snapshot } from './types'

const EMPTY_SNAPSHOT: Snapshot = {
	description: '',
	resource: { kind: 'none' },
	wire: { healthy: true },
	packets: [],
	log: [],
}

export function RetryLabViz() {
	const { activeScenarioId, currentSnapshot } = useIdempotencyStore(
		useShallow((s) => ({
			activeScenarioId: s.activeScenarioId,
			currentSnapshot: selectCurrentSnapshot(s),
		})),
	)

	const snapshot = currentSnapshot ?? EMPTY_SNAPSHOT

	return (
		<div
			className="relative w-full h-full flex flex-col"
			role="img"
			aria-label="Retry Lab — animated diagram of a client, server, and the wire between them. Shows requests and responses traveling across HTTP, including failure modes."
		>
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{activeScenarioId ? snapshot.description : 'Retry Lab idle.'}
			</div>

			{/* SVG viz: wire + boxes + packets */}
			<div className="relative flex-1 min-h-[200px] flex items-center justify-center px-2 pt-2">
				<svg
					viewBox={LAB_VIEWBOX}
					className="w-full h-full max-h-full"
					preserveAspectRatio="xMidYMid meet"
				>
					<Client />
					<Server />
					<Wire wire={snapshot.wire} />
					{snapshot.packets.map((packet) => (
						<Packet key={packet.id} packet={packet} />
					))}
				</svg>
			</div>

			{/* HTML panels below the SVG */}
			<div className="grid grid-cols-2 gap-3 p-3 pt-1 h-[45%] min-h-[200px]">
				<RequestLog log={snapshot.log} />
				<ResourcePanel resource={snapshot.resource} />
			</div>
		</div>
	)
}
