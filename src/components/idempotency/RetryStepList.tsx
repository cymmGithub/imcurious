'use client'

import { ChevronLeft, ChevronRight, Play, RotateCcw } from 'lucide-react'
import { useIdempotencyStore } from '@/stores/idempotencyStore'
import { SCENARIOS, type ScenarioId } from './scenarios'

interface RetryStepListProps {
	scenarioId: ScenarioId
}

function stepOpacity(
	isActive: boolean,
	stepIsActive: boolean,
	stepIsPast: boolean,
): number {
	if (!isActive) return 1
	if (stepIsActive) return 1
	return stepIsPast ? 0.55 : 0.35
}

export function RetryStepList({ scenarioId }: RetryStepListProps) {
	const activeScenarioId = useIdempotencyStore((s) => s.activeScenarioId)
	const stepIndex = useIdempotencyStore((s) => s.stepIndex)
	const runScenario = useIdempotencyStore((s) => s.runScenario)
	const stepForward = useIdempotencyStore((s) => s.stepForward)
	const stepBack = useIdempotencyStore((s) => s.stepBack)

	const scenario = SCENARIOS[scenarioId]
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

	const isActive = activeScenarioId === scenarioId
	const isLastStep = isActive && stepIndex >= scenario.steps.length - 1
	const isFirstStep = isActive && stepIndex === 0
	const prevDisabled = !isActive || isFirstStep
	const nextDisabled = isActive && isLastStep

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
					const stepIsPast = isActive && i < stepIndex
					return (
						<li
							key={i}
							className="flex items-start gap-3 transition-all duration-300 pl-3"
							style={{
								opacity: stepOpacity(isActive, stepIsActive, stepIsPast),
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
						onClick={stepBack}
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
							onClick={() => runScenario(scenarioId)}
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

					<button
						onClick={() => (isActive ? stepForward() : runScenario(scenarioId))}
						disabled={nextDisabled}
						className="font-mono text-xs min-w-9 min-h-9 px-3 rounded inline-flex items-center justify-center gap-1"
						style={{
							color: 'var(--color-surface)',
							background: 'var(--color-chalk)',
							border: 'none',
							cursor: nextDisabled ? 'not-allowed' : 'pointer',
							opacity: nextDisabled ? 0.5 : 1,
						}}
						aria-label={
							!isActive
								? `Run ${scenario.title} scenario`
								: isLastStep
									? 'Finished'
									: 'Next step'
						}
					>
						{!isActive ? (
							<>
								<Play size={12} fill="currentColor" /> run
							</>
						) : isLastStep ? (
							<>done</>
						) : (
							<ChevronRight size={14} />
						)}
					</button>
				</div>
			</div>
		</div>
	)
}
