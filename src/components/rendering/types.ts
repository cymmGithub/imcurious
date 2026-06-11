// Data model for the rendering-strategies post.
//
// Every concept in the post is a statement about page-block states over
// time, so one block model serves all eight scenarios: CSR, SSR, hydration,
// SSG, ISR, streaming, RSC, PPR. Each scenario step is a *complete*
// snapshot of the scene (packets, blocks, CDN, server, timeline) — the
// same declarative-snapshot idiom as `idempotency/types.ts`.

export type BlockId = 'header' | 'nav' | 'content' | 'sidebar' | 'comments'

export const BLOCK_IDS: BlockId[] = [
	'header',
	'nav',
	'content',
	'sidebar',
	'comments',
]

// blank → skeleton shimmer → inked but inert → fully alive
export type PaintState = 'empty' | 'fallback' | 'painted' | 'hydrated'

// Where the block's markup/code comes from. Rendered as a color code from
// the RSC stage onward; earlier stages leave it undefined (no coloring).
export type BlockOrigin = 'static' | 'server' | 'client'

export type BlockState = {
	paint: PaintState
	origin?: BlockOrigin
}

export type BlocksState = Record<BlockId, BlockState>

// Every scenario needs "all blocks in state X" snapshots; build them here
// instead of hand-writing the five-block record in each scenario file.
export function blocksAll(paint: PaintState): BlocksState {
	return Object.fromEntries(
		BLOCK_IDS.map((id) => [id, { paint }]),
	) as BlocksState
}

export type ActorId = 'browser' | 'cdn' | 'server'

export type PacketKind =
	| 'request'
	| 'html-shell'
	| 'html-full'
	| 'html-chunk'
	| 'js-bundle'
	| 'data'
	| 'rsc-payload'

export type PacketState = {
	id: string
	kind: PacketKind
	from: ActorId
	to: ActorId
	// 0 = at `from`, 1 = at `to`
	position: number
	// Relative payload size, 0..1 — drives the rendered packet size.
	// Explicit in the data (not a per-kind default) so size relationships
	// like "CSR's js-bundle is the largest packet in the post" and
	// "RSC's bundle is smaller than SSR's" are testable invariants.
	size: number
	label?: string
}

export type CdnEntry = 'none' | 'fresh' | 'stale'

export type CdnState = {
	entry: CdnEntry
	// e.g. a freshness-timer annotation during the ISR walk
	note?: string
}

export type ServerActivity =
	| 'idle'
	| 'rendering'
	| 'building'
	| 'regenerating'
	| 'streaming'

export type ServerState = {
	activity: ServerActivity
	note?: string
}

// Each metric is null until the step where it is reached, then carries the
// relative time (0..1 of the strategy's full load) at which it completed.
// The final step of a scenario therefore holds the lane data for race mode.
export type TimelineState = {
	ttfb: number | null
	fcp: number | null
	interactive: number | null
}

export type BrowserState = {
	blocks: BlocksState
	note?: string
}

export type RenderSnapshot = {
	description: string
	packets: PacketState[]
	browser: BrowserState
	cdn: CdnState
	server: ServerState
	timeline: TimelineState
}

export type RenderScenario = {
	id: string
	title: string
	steps: RenderSnapshot[]
}

// The four classic strategies raced in stage 7.
export type RaceLaneId = 'csr' | 'ssr' | 'ssg' | 'isr'

export const RACE_LANE_IDS: RaceLaneId[] = ['csr', 'ssr', 'ssg', 'isr']
