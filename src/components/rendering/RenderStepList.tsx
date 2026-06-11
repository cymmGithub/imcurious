'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import {
	ChevronLeft,
	ChevronRight,
	FastForward,
	Pause,
	RotateCcw,
} from 'lucide-react'
import { useRenderingStore } from '@/stores/renderingStore'
import { RENDER_SCENARIOS, type RenderScenarioId } from './scenarios'

const AUTO_PLAY_INTERVAL_MS = 2500

interface RenderStepListProps {
	scenarioId: RenderScenarioId
}

function stepOpacity(
	isActive: boolean,
	index: number,
	stepIndex: number,
): number {
	// Before activation only the first step reads at full strength — the
	// walkthrough is the reward for pressing run, not a spoiler above it.
	if (!isActive) return index === 0 ? 1 : 0.35
	if (index === stepIndex) return 1
	return index < stepIndex ? 0.55 : 0.35
}

export function RenderStepList({ scenarioId }: RenderStepListProps) {
	const activeScenarioId = useRenderingStore((s) => s.activeScenarioId)
	const stepIndex = useRenderingStore((s) => s.stepIndex)
	const runScenario = useRenderingStore((s) => s.runScenario)
	const stepForward = useRenderingStore((s) => s.stepForward)
	const stepBack = useRenderingStore((s) => s.stepBack)
	const reducedMotion = useReducedMotion()

	const scenario = RENDER_SCENARIOS[scenarioId]
	const isActive = activeScenarioId === scenarioId
	const isLastStep =
		isActive && scenario != null && stepIndex >= scenario.steps.length - 1

	const [autoPlay, setAutoPlay] = useState(false)

	useEffect(() => {
		if (!autoPlay) return
		if (!isActive || isLastStep) {
			setAutoPlay(false)
			return
		}
		const timer = setInterval(stepForward, AUTO_PLAY_INTERVAL_MS)
		return () => clearInterval(timer)
	}, [autoPlay, isActive, isLastStep, stepForward])

	if (!scenario) {
		return (
			<div
				className="my-6 p-3 rounded text-[12px] font-mono"
				style={{ color: '#ef4444', border: '1px solid #ef4444' }}
			>
				Unknown scenario: {scenarioId}
			</div>
		)
	}

	const isFirstStep = isActive && stepIndex === 0
	const prevDisabled = !isActive || isFirstStep

	const manualStepBack = () => {
		setAutoPlay(false)
		stepBack()
	}
	const manualStepForward = () => {
		setAutoPlay(false)
		if (isActive) stepForward()
		else runScenario(scenarioId)
	}
	const manualReplay = () => {
		setAutoPlay(false)
		runScenario(scenarioId)
	}
	const toggleAutoPlay = () => {
		if (!autoPlay && !isActive) runScenario(scenarioId)
		setAutoPlay((p) => !p)
	}

	return (
		<div
			className="my-8 rounded-lg overflow-hidden"
			style={{ border: '1px solid var(--color-chalk-faint)' }}
		>
			<div
				className="flex items-center justify-between px-4 py-2"
				style={{
					background: 'var(--color-surface-card)',
					borderBottom: '1px solid var(--color-chalk-faint)',
				}}
			>
				<div
					className="font-sketch text-sm tracking-wide"
					style={{ color: 'var(--color-chalk)' }}
				>
					{scenario.title}
				</div>
				<div
					className="font-mono text-[10px]"
					style={{ color: 'var(--color-chalk-dim)' }}
				>
					{isActive
						? `${stepIndex + 1} / ${scenario.steps.length}`
						: `${scenario.steps.length} steps`}
				</div>
			</div>

			<ol className="p-4 space-y-2 list-none pl-0 m-0">
				{scenario.steps.map((step, i) => {
					const stepIsActive = isActive && i === stepIndex
					return (
						<li
							key={i}
							className="flex items-start gap-3 transition-all duration-300 pl-3"
							style={{
								opacity: stepOpacity(isActive, i, stepIndex),
								borderLeft: stepIsActive
									? '2px solid var(--color-chalk)'
									: '2px solid transparent',
								color: 'var(--color-chalk)',
								fontSize: 14,
								lineHeight: 1.55,
							}}
						>
							<span
								className="font-mono text-[10px] flex-shrink-0 mt-[3px]"
								style={{ color: 'var(--color-chalk-dim)' }}
							>
								{String(i + 1).padStart(2, '0')}
							</span>
							<span>{step.description}</span>
						</li>
					)
				})}
			</ol>

			<div
				className="flex items-center justify-between px-4 py-2"
				style={{
					background: 'var(--color-surface-card)',
					borderTop: '1px solid var(--color-chalk-faint)',
				}}
			>
				<div className="flex items-center gap-2">
					<button
						onClick={manualStepBack}
						disabled={prevDisabled}
						aria-label="Previous step"
						className="font-mono text-xs min-w-9 min-h-9 inline-flex items-center justify-center rounded"
						style={{
							color: 'var(--color-chalk)',
							background: 'var(--color-surface-card)',
							border: '1px solid var(--color-chalk-faint)',
							opacity: prevDisabled ? 0.3 : 1,
							cursor: prevDisabled ? 'not-allowed' : 'pointer',
						}}
					>
						<ChevronLeft size={14} />
					</button>

					{isLastStep && (
						<button
							onClick={manualReplay}
							aria-label="Replay scenario"
							className="font-mono text-xs min-w-9 min-h-9 inline-flex items-center justify-center rounded"
							style={{
								color: 'var(--color-chalk-dim)',
								background: 'var(--color-surface-card)',
								border: '1px solid var(--color-chalk-faint)',
								cursor: 'pointer',
							}}
						>
							<RotateCcw size={12} />
						</button>
					)}

					{!isLastStep && (
						<button
							onClick={manualStepForward}
							className="font-mono text-xs min-w-9 min-h-9 px-3 rounded inline-flex items-center justify-center gap-1"
							style={{
								color: 'var(--color-surface)',
								background: 'var(--color-chalk)',
								border: 'none',
								cursor: 'pointer',
							}}
							aria-label={
								!isActive ? `Run ${scenario.title} scenario` : 'Next step'
							}
						>
							<ChevronRight size={14} />
						</button>
					)}
				</div>

				{!reducedMotion && !isLastStep && (
					<button
						onClick={toggleAutoPlay}
						aria-label={autoPlay ? 'Pause auto-play' : 'Auto-play steps'}
						className="font-mono text-xs min-h-9 px-3 rounded inline-flex items-center justify-center gap-1.5"
						style={{
							color: 'var(--color-chalk-dim)',
							background: 'var(--color-surface-card)',
							border: '1px solid var(--color-chalk-faint)',
							cursor: 'pointer',
						}}
					>
						{autoPlay ? <Pause size={12} /> : <FastForward size={12} />}
						auto
					</button>
				)}
			</div>
		</div>
	)
}
