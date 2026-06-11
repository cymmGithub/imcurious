'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Play, RotateCcw } from 'lucide-react'
import { useRenderingStore } from '@/stores/renderingStore'
import { RACE_LANE_SCENARIOS } from './scenarios'
import {
	RACE_LANE_IDS,
	type BlocksState,
	type PaintState,
	type RaceLaneId,
	type TimelineState,
} from './types'
import { PageSkeleton, SKELETON_WIDTH, SKELETON_HEIGHT } from './PageSkeleton'
import { TimelineBars } from './TimelineBars'

const RACE_DURATION_MS = 5000

// Scale factor that fits a naturally-sized card into the available box.
// Exported for tests: the race card must never overflow the sticky viz band,
// whatever the viewport (40vh on short phones can be under 270px).
export function fitScale(
	availableWidth: number,
	availableHeight: number,
	naturalWidth: number,
	naturalHeight: number,
): number {
	if (naturalWidth <= 0 || naturalHeight <= 0) return 1
	return Math.min(
		1,
		availableWidth / naturalWidth,
		availableHeight / naturalHeight,
	)
}

const LANE_LABEL: Record<RaceLaneId, string> = {
	csr: 'CSR',
	ssr: 'SSR',
	ssg: 'SSG',
	isr: 'ISR',
}

function laneTimeline(lane: RaceLaneId): TimelineState {
	const steps = RACE_LANE_SCENARIOS[lane].steps
	return steps[steps.length - 1].timeline
}

// The thumbnail derives its paint state from the lane's own timeline, so
// CSR's blank-then-pop and SSG's instant paint replay automatically.
function laneBlocks(timeline: TimelineState, progress: number): BlocksState {
	let paint: PaintState = 'empty'
	if (timeline.interactive !== null && progress >= timeline.interactive) {
		paint = 'hydrated'
	} else if (timeline.fcp !== null && progress >= timeline.fcp) {
		paint = 'painted'
	}
	return {
		header: { paint },
		nav: { paint },
		content: { paint },
		sidebar: { paint },
		comments: { paint },
	}
}

export function RaceMode() {
	const raceStatus = useRenderingStore((s) => s.raceStatus)
	const raceRunId = useRenderingStore((s) => s.raceRunId)
	const startRace = useRenderingStore((s) => s.startRace)
	const finishRace = useRenderingStore((s) => s.finishRace)
	const reducedMotion = useReducedMotion()

	const [progress, setProgress] = useState(0)
	const frameRef = useRef(0)

	useEffect(() => {
		if (raceStatus !== 'running' || reducedMotion) return
		const startedAt = performance.now()
		setProgress(0)
		const tick = (now: number) => {
			const p = Math.min(1, (now - startedAt) / RACE_DURATION_MS)
			setProgress(p)
			if (p < 1) {
				frameRef.current = requestAnimationFrame(tick)
			} else {
				finishRace()
			}
		}
		frameRef.current = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(frameRef.current)
	}, [raceStatus, raceRunId, reducedMotion, finishRace])

	// Reduced motion: no autoplay either way, but any state renders the end
	// state — final relative bar lengths, no animation.
	const displayProgress = reducedMotion
		? 1
		: raceStatus === 'idle'
			? 0
			: progress
	const thumbScale = 0.18

	const outerRef = useRef<HTMLDivElement>(null)
	const cardRef = useRef<HTMLDivElement>(null)
	const [scale, setScale] = useState(1)

	// offsetWidth/offsetHeight ignore transforms, so the card always reports
	// its natural size and the scale never feeds back into itself.
	useEffect(() => {
		const outer = outerRef.current
		const card = cardRef.current
		if (!outer || !card) return
		const update = () =>
			setScale(
				fitScale(
					outer.clientWidth,
					outer.clientHeight,
					card.offsetWidth,
					card.offsetHeight,
				),
			)
		update()
		const observer = new ResizeObserver(update)
		observer.observe(outer)
		observer.observe(card)
		return () => observer.disconnect()
	}, [])

	return (
		<div
			ref={outerRef}
			className="w-full h-full flex items-center justify-center"
		>
			<div
				ref={cardRef}
				className="w-full max-w-md rounded-lg p-3 lg:p-4"
				style={{
					background: 'var(--color-surface)',
					border: '1px solid var(--color-chalk-faint)',
					transform: scale < 1 ? `scale(${scale})` : undefined,
				}}
			>
				<div className="flex items-center justify-between mb-2 lg:mb-3">
					<div
						className="font-sketch text-sm tracking-wide"
						style={{ color: 'var(--color-chalk)' }}
					>
						The Strategy Race
					</div>
					<button
						onClick={startRace}
						className="font-mono text-xs min-h-9 px-3 rounded inline-flex items-center justify-center gap-1.5"
						style={{
							color: 'var(--color-surface)',
							background: 'var(--color-chalk)',
							border: 'none',
							cursor: 'pointer',
						}}
						aria-label={
							raceStatus === 'idle' ? 'Run the race' : 'Replay the race'
						}
					>
						{raceStatus === 'idle' ? (
							<Play size={12} />
						) : (
							<RotateCcw size={12} />
						)}
						{raceStatus === 'idle' ? 'race' : 'replay'}
					</button>
				</div>

				<div className="space-y-2 lg:space-y-3">
					{RACE_LANE_IDS.map((lane) => {
						const timeline = laneTimeline(lane)
						return (
							<div key={lane} className="flex items-center gap-3">
								<svg
									viewBox={`0 0 ${SKELETON_WIDTH} ${SKELETON_HEIGHT}`}
									width={SKELETON_WIDTH * thumbScale}
									height={SKELETON_HEIGHT * thumbScale}
									className="flex-shrink-0"
									aria-hidden="true"
								>
									<PageSkeleton
										blocks={laneBlocks(timeline, displayProgress)}
										compact
									/>
								</svg>
								<div className="flex-1 min-w-0">
									<div
										className="font-mono text-[10px] mb-1"
										style={{
											color: 'var(--color-chalk)',
											letterSpacing: '0.14em',
										}}
									>
										{LANE_LABEL[lane]}
									</div>
									<TimelineBars
										timeline={timeline}
										variant="lane"
										progress={displayProgress}
									/>
								</div>
							</div>
						)
					})}
				</div>

				<div
					className="mt-2 lg:mt-3 font-mono text-[9px] italic"
					style={{ color: 'var(--color-chalk-dim)' }}
				>
					timings illustrative — the relative order is the lesson
				</div>
			</div>
		</div>
	)
}
