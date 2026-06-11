// Scene geometry — shared across the SVG components.
//
// Coordinate system:
//   viewBox: "0 0 760 430"
//   - The browser fills the left half (it contains the page skeleton, the
//     size-dominant element). CDN sits top-right, server bottom-right.
//   - Three wires: browser↔cdn, browser↔server, cdn↔server.
//   - A packet's position is 0 at its `from` actor and 1 at its `to` actor.

import type { ActorId } from './types'

export const SCENE_VIEWBOX = '0 0 760 430'

export const BROWSER_BOX = { x: 24, y: 48, width: 304, height: 340 } as const
export const BROWSER_CHROME_HEIGHT = 26

export const CDN_BOX = { cx: 620, cy: 110, width: 150, height: 92 } as const
export const SERVER_BOX = { cx: 620, cy: 330, width: 150, height: 92 } as const

// The page-skeleton block grid, in scene coordinates inside the browser
// viewport. The skeleton component reuses these at scale for race thumbs.
export const SKELETON = {
	x: 38,
	y: 92,
	width: 276,
	height: 282,
} as const

type Point = { x: number; y: number }

type WireKey = 'browser-cdn' | 'browser-server' | 'cdn-server'

const WIRES: Record<
	WireKey,
	{ a: ActorId; b: ActorId; from: Point; to: Point }
> = {
	'browser-cdn': {
		a: 'browser',
		b: 'cdn',
		from: { x: 332, y: 130 },
		to: { x: 541, y: 110 },
	},
	'browser-server': {
		a: 'browser',
		b: 'server',
		from: { x: 332, y: 300 },
		to: { x: 541, y: 330 },
	},
	'cdn-server': {
		a: 'cdn',
		b: 'server',
		from: { x: 620, y: 160 },
		to: { x: 620, y: 280 },
	},
}

export const WIRE_KEYS = Object.keys(WIRES) as WireKey[]

export function wireEndpoints(key: WireKey): { from: Point; to: Point } {
	return WIRES[key]
}

function wireFor(
	from: ActorId,
	to: ActorId,
): {
	key: WireKey
	reversed: boolean
} {
	for (const key of WIRE_KEYS) {
		const w = WIRES[key]
		if (w.a === from && w.b === to) return { key, reversed: false }
		if (w.a === to && w.b === from) return { key, reversed: true }
	}
	throw new Error(`No wire between ${from} and ${to}`)
}

export function packetPoint(
	from: ActorId,
	to: ActorId,
	position: number,
): Point {
	const clamped = Math.max(0, Math.min(1, position))
	const { key, reversed } = wireFor(from, to)
	const wire = WIRES[key]
	const start = reversed ? wire.to : wire.from
	const end = reversed ? wire.from : wire.to
	return {
		x: start.x + (end.x - start.x) * clamped,
		y: start.y + (end.y - start.y) * clamped,
	}
}
