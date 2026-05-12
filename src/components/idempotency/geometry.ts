// Lab geometry — shared across the SVG components.
//
// Coordinate system:
//   viewBox: "-30 -20 720 380"  (visible region ~720x380)
//   - The wire runs horizontally at y=WIRE_Y from x=WIRE_X_START to x=WIRE_X_END.
//   - Position 0 = at client edge; Position 1 = at server edge.

export const LAB_VIEWBOX = '-30 -20 720 380'

export const WIRE_Y = 140
export const WIRE_X_START = 150
export const WIRE_X_END = 510

export const CLIENT_BOX = {
	x: -10,
	y: 80,
	width: 150,
	height: 120,
	labelY: 56,
} as const

export const SERVER_BOX = {
	x: 520,
	y: 80,
	width: 150,
	height: 120,
	labelY: 56,
} as const

export function packetXFromPosition(position: number): number {
	const clamped = Math.max(0, Math.min(1, position))
	return WIRE_X_START + (WIRE_X_END - WIRE_X_START) * clamped
}
