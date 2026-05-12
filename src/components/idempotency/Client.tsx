'use client'

import { CLIENT_BOX } from './geometry'

export function Client() {
	return (
		<g>
			<rect
				x={CLIENT_BOX.x}
				y={CLIENT_BOX.y}
				width={CLIENT_BOX.width}
				height={CLIENT_BOX.height}
				rx={6}
				fill="var(--color-surface-card)"
				stroke="var(--color-chalk-faint)"
				strokeWidth={1.5}
			/>
			<text
				x={CLIENT_BOX.x + CLIENT_BOX.width / 2}
				y={CLIENT_BOX.labelY}
				textAnchor="middle"
				fontSize={14}
				fontFamily="var(--font-sketch, ui-sans-serif, sans-serif)"
				fontWeight={600}
				fill="var(--color-chalk)"
			>
				Client
			</text>
			<text
				x={CLIENT_BOX.x + CLIENT_BOX.width / 2}
				y={CLIENT_BOX.y + CLIENT_BOX.height / 2 + 4}
				textAnchor="middle"
				fontSize={11}
				fontFamily="var(--font-mono, ui-monospace, monospace)"
				fill="var(--color-chalk-dim)"
			>
				your code
			</text>
		</g>
	)
}
