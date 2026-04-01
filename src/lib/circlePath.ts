// src/lib/circlePath.ts

export const CIRCLE = {
	cx: 300,
	cy: 300,
	r: 180,
} as const

export const VIEWBOX = '-60 -5 720 555'

// Station positions at 180° intervals (0°, 180°)
// 0° = top (12 o'clock), clockwise
function stationAnchor(angleDeg: number) {
	const rad = (angleDeg * Math.PI) / 180
	return {
		x: Math.round(CIRCLE.cx + CIRCLE.r * Math.sin(rad)),
		y: Math.round(CIRCLE.cy - CIRCLE.r * Math.cos(rad)),
	}
}

export const STATION_POSITIONS = {
	queues: {
		pathT: 0,
		label: 'Queues',
		anchor: stationAnchor(0), // (300, 120) — 12 o'clock
		color: '#ffffff',
	},
	render: {
		pathT: 1 / 2,
		label: 'Render',
		anchor: stationAnchor(180), // (300, 480) — 6 o'clock
		color: '#ffffff',
	},
} as const

// SVG path for animateMotion (starts at top, clockwise)
export const ORBIT_PATH = `M ${CIRCLE.cx} ${CIRCLE.cy - CIRCLE.r} A ${CIRCLE.r} ${CIRCLE.r} 0 1 1 ${CIRCLE.cx - 0.01} ${CIRCLE.cy - CIRCLE.r} Z`

// Web APIs box position (top-right, within viewBox bounds)
export const WEB_API_POSITION = {
	x: 470,
	y: -40,
}
