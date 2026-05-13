// Lab geometry — shared across the SVG components.
//
// Coordinate system:
//   viewBox: "-30 -20 740 380"  (visible region ~740x380)
//   - The wire runs horizontally at y=WIRE_Y from x=WIRE_X_START to x=WIRE_X_END.
//   - Position 0 = at client edge; Position 1 = at server edge.
//   - Endpoints anchor the wire at icon centers; labels stack below.

export const LAB_VIEWBOX = '-30 -20 740 380'

export const WIRE_Y = 110
export const WIRE_X_START = 70
export const WIRE_X_END = 610

export const CLIENT_ANCHOR = {
	iconCx: 38,
	iconCy: 110,
	labelY: 168,
	subtitleY: 186,
} as const

export const SERVER_ANCHOR = {
	iconCx: 642,
	iconCy: 110,
	labelY: 168,
	subtitleY: 186,
} as const

export function packetXFromPosition(position: number): number {
	const clamped = Math.max(0, Math.min(1, position))
	return WIRE_X_START + (WIRE_X_END - WIRE_X_START) * clamped
}
