'use client'

import { motion } from 'framer-motion'
import {
	selectCurrentRenderSnapshot,
	useRenderingStore,
} from '@/stores/renderingStore'
import { blocksAll, type RenderSnapshot, type BlocksState } from './types'
import { RENDER_SCENARIOS, type RenderScenarioId } from './scenarios'
import { SCENE_VIEWBOX, WIRE_KEYS, wireEndpoints } from './geometry'
import { ORIGIN_COLORS } from './PageSkeleton'
import { BrowserActor } from './BrowserActor'
import { CdnActor } from './CdnActor'
import { ServerActor } from './ServerActor'
import { WirePacket } from './WirePacket'
import { TimelineBars, type TimelineMetric } from './TimelineBars'
import { RaceMode } from './RaceMode'

// Which scenario "owns" each scroll stage. The stage's establishing shot is
// that scenario's first step; running the scenario from the step list takes
// over the same scene.
export const STAGE_SCENARIO: Partial<Record<number, RenderScenarioId>> = {
	2: 'csr-blank-then-pop',
	3: 'ssr-painted-then-frozen',
	4: 'hydration-inert-gap',
	5: 'ssg-build-once',
	6: 'isr-stale-while-revalidate',
	8: 'streaming-out-of-order',
	9: 'rsc-shrinking-bundle',
	10: 'ppr-static-frame-streamed-holes',
}

// Which metric each modern technique attacks — drives the HUD highlight.
const HUD_HIGHLIGHT: Partial<Record<number, TimelineMetric[]>> = {
	8: ['fcp'],
	9: ['interactive'],
	10: ['ttfb', 'fcp'],
}

const SSG_STAGE = 5
const RACE_STAGE = 7

const ALL_EMPTY: BlocksState = blocksAll('empty')

const IDLE_SNAPSHOT: RenderSnapshot = {
	description:
		'Three actors: a browser with an empty page skeleton, a CDN, and a server.',
	packets: [],
	browser: { blocks: ALL_EMPTY },
	cdn: { entry: 'none' },
	server: { activity: 'idle' },
	timeline: { ttfb: null, fcp: null, interactive: null },
}

// Stage 11 recap: the per-component world — one page, three origins.
const RECAP_SNAPSHOT: RenderSnapshot = {
	description:
		'The decision framework: one page where every block picked its own origin — static frame, server content, client islands.',
	packets: [],
	browser: {
		blocks: {
			header: { paint: 'hydrated', origin: 'static' },
			nav: { paint: 'hydrated', origin: 'static' },
			content: { paint: 'hydrated', origin: 'server' },
			sidebar: { paint: 'hydrated', origin: 'client' },
			comments: { paint: 'hydrated', origin: 'server' },
		},
		note: 'per-component decisions',
	},
	cdn: { entry: 'fresh' },
	server: { activity: 'idle' },
	timeline: { ttfb: 0.05, fcp: 0.12, interactive: 0.5 },
}

function establishingShot(stage: number): RenderSnapshot {
	const scenarioId = STAGE_SCENARIO[stage]
	if (scenarioId) return RENDER_SCENARIOS[scenarioId].steps[0]
	if (stage === 11) return RECAP_SNAPSHOT
	return IDLE_SNAPSHOT
}

interface RenderingStageVizProps {
	activeStage: number
}

export function RenderingStageViz({ activeStage }: RenderingStageVizProps) {
	const snapshot = useRenderingStore(selectCurrentRenderSnapshot)

	// A running scenario always drives the scene — RenderingScrollStage resets
	// it when the reader scrolls to a section it doesn't own, so a stepper
	// click can never be silently swallowed by scroll-stage disagreement.
	const display = snapshot ?? establishingShot(activeStage)

	const cdnDimmed = activeStage < SSG_STAGE
	const isRaceStage = activeStage === RACE_STAGE
	const hudHighlight = HUD_HIGHLIGHT[activeStage]
	const timelineHasValue =
		display.timeline.ttfb !== null ||
		display.timeline.fcp !== null ||
		display.timeline.interactive !== null
	// The HUD accompanies every strategy stage so the prose's timeline
	// narration has a visual referent from its first use; the race stage
	// replaces the scene, and an all-null timeline would render an empty box.
	const hudVisible =
		activeStage >= 2 && activeStage <= 10 && !isRaceStage && timelineHasValue
	const visibleOrigins = (
		Object.keys(ORIGIN_COLORS) as (keyof typeof ORIGIN_COLORS)[]
	).filter((origin) =>
		Object.values(display.browser.blocks).some((b) => b.origin === origin),
	)

	return (
		<div
			className="relative w-full h-full flex flex-col"
			role="img"
			aria-label="Rendering stage — an animated diagram of a browser assembling a page from blocks, a CDN, and a server, with typed packets traveling the wires between them."
		>
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{display.description}
			</div>

			<motion.div
				className="relative flex-1 min-h-0 flex items-center justify-center px-2 py-2"
				initial={false}
				animate={{ opacity: isRaceStage ? 0.12 : 1 }}
				transition={{ duration: 0.4 }}
			>
				<svg
					viewBox={SCENE_VIEWBOX}
					className="w-full h-full max-h-full"
					preserveAspectRatio="xMidYMid meet"
				>
					{WIRE_KEYS.map((key) => {
						const { from, to } = wireEndpoints(key)
						const isCdnWire = key !== 'browser-server'
						return (
							<line
								key={key}
								x1={from.x}
								y1={from.y}
								x2={to.x}
								y2={to.y}
								stroke="var(--color-chalk-faint)"
								strokeWidth={2}
								strokeLinecap="round"
								opacity={isCdnWire && cdnDimmed ? 0.22 : 0.8}
							/>
						)
					})}

					<BrowserActor browser={display.browser} />
					<CdnActor cdn={display.cdn} dimmed={cdnDimmed} />
					<ServerActor server={display.server} />

					{display.packets.map((packet) => (
						<WirePacket key={packet.id} packet={packet} />
					))}
				</svg>
			</motion.div>

			{isRaceStage && (
				<div className="absolute inset-0 flex items-center justify-center p-3 lg:p-6">
					<RaceMode />
				</div>
			)}

			{hudVisible && (
				<div
					className="absolute top-3 lg:top-auto lg:bottom-3 right-3 rounded-md px-3 py-2 w-40 lg:w-[200px]"
					style={{
						background: 'var(--color-surface)',
						border: '1px solid var(--color-chalk-faint)',
					}}
				>
					<TimelineBars
						timeline={display.timeline}
						variant="hud"
						highlight={hudHighlight}
					/>
				</div>
			)}

			{visibleOrigins.length > 0 && !isRaceStage && (
				<div
					className="absolute bottom-3 lg:bottom-16 left-3 rounded-md px-3 py-1.5 flex flex-row gap-3"
					style={{
						background: 'var(--color-surface)',
						border: '1px solid var(--color-chalk-faint)',
					}}
					aria-label="Block origin legend"
				>
					{visibleOrigins.map((origin) => (
						<div key={origin} className="flex items-center gap-1.5">
							<span
								aria-hidden="true"
								style={{
									width: 10,
									height: 10,
									borderRadius: 2,
									border: `1.5px solid ${ORIGIN_COLORS[origin]}`,
								}}
							/>
							<span
								className="font-mono text-[9px]"
								style={{
									color: 'var(--color-chalk-dim)',
									letterSpacing: '0.1em',
								}}
							>
								{origin.toUpperCase()}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
