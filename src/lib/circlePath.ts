// src/lib/circlePath.ts

export const CIRCLE = {
	cx: 300,
	cy: 300,
	r: 180,
} as const

export const VIEWBOX = '-60 -5 720 555'

// Station positions at 120° intervals (0°, 120°, 240°)
// 0° = top (12 o'clock), clockwise
function stationAnchor(angleDeg: number) {
	const rad = (angleDeg * Math.PI) / 180
	return {
		x: Math.round(CIRCLE.cx + CIRCLE.r * Math.sin(rad)),
		y: Math.round(CIRCLE.cy - CIRCLE.r * Math.cos(rad)),
	}
}

export const STATION_POSITIONS = {
	microtask: {
		pathT: 0,
		label: 'Microtask Queue',
		anchor: stationAnchor(0), // (300, 120) — 12 o'clock
		color: '#ffffff',
	},
	task: {
		pathT: 1 / 3,
		label: 'Callback Queue',
		anchor: stationAnchor(120), // (456, 390) — ~5 o'clock
		color: '#ffffff',
	},
	render: {
		pathT: 2 / 3,
		label: 'Render',
		anchor: stationAnchor(240), // (144, 390) — ~7 o'clock
		color: '#ffffff',
	},
} as const

// SVG path for animateMotion (starts at top, clockwise)
export const ORBIT_PATH = `M ${CIRCLE.cx} ${CIRCLE.cy - CIRCLE.r} A ${CIRCLE.r} ${CIRCLE.r} 0 1 1 ${CIRCLE.cx - 0.01} ${CIRCLE.cy - CIRCLE.r} Z`

// Web APIs box position (top-right, within viewBox bounds)
export const WEB_API_POSITION = {
	x: 450,
	y: 5,
}
