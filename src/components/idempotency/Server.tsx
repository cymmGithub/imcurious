'use client'

import { SERVER_BOX } from './geometry'

export function Server() {
	return (
		<g>
			<rect
				x={SERVER_BOX.x}
				y={SERVER_BOX.y}
				width={SERVER_BOX.width}
				height={SERVER_BOX.height}
				rx={6}
				fill="var(--color-surface-card)"
				stroke="var(--color-chalk-faint)"
				strokeWidth={1.5}
			/>
			<text
				x={SERVER_BOX.x + SERVER_BOX.width / 2}
				y={SERVER_BOX.labelY}
				textAnchor="middle"
				fontSize={14}
				fontFamily="var(--font-sketch, ui-sans-serif, sans-serif)"
				fontWeight={600}
				fill="var(--color-chalk)"
			>
				Server
			</text>
			<text
				x={SERVER_BOX.x + SERVER_BOX.width / 2}
				y={SERVER_BOX.y + SERVER_BOX.height / 2 + 4}
				textAnchor="middle"
				fontSize={11}
				fontFamily="var(--font-mono, ui-monospace, monospace)"
				fill="var(--color-chalk-dim)"
			>
				the API
			</text>
		</g>
	)
}
