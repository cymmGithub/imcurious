'use client'

import { useEventLoopStore } from '@/stores/eventLoopStore'
import { SCENARIOS } from '@/lib/scenarios'
import {
	SCENARIO_HIGHLIGHTS_DARK,
	SCENARIO_HIGHLIGHTS_LIGHT,
} from '@/lib/__generated__/scenarioHighlights'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

interface RunCodeProps {
	scenarioId: string
}

export function RunCode({ scenarioId }: RunCodeProps) {
	const activeScenarioId = useEventLoopStore((s) => s.activeScenarioId)
	const cursorState = useEventLoopStore((s) => s.cursorState)
	const syncFrameIndex = useEventLoopStore((s) => s.syncFrameIndex)
	const syncFrameOps = useEventLoopStore((s) => s.syncFrameOps)
	const activeLine = useEventLoopStore((s) => s.activeLine)
	const runScenario = useEventLoopStore((s) => s.runScenario)
	const stepForward = useEventLoopStore((s) => s.stepForward)
	const stepBack = useEventLoopStore((s) => s.stepBack)
	const theme = useTheme()
	const oppositeTheme = theme === 'dark' ? 'light' : 'dark'
	const scenario = SCENARIOS[scenarioId]
	const highlights =
		theme === 'light' ? SCENARIO_HIGHLIGHTS_LIGHT : SCENARIO_HIGHLIGHTS_DARK
	const rawHighlightedLines = highlights[scenarioId] ?? []
	const highlightedLines = rawHighlightedLines.map((line) =>
		line.replace('__THEME__', oppositeTheme),
	)

	if (!scenario) return null

	const isActive = activeScenarioId === scenarioId
	const isStepping = isActive && cursorState === 'STEPPING_SYNC'
	const isLastStep = isStepping && syncFrameIndex >= syncFrameOps.length - 1
	const currentActiveLine = isActive ? activeLine : null
	const lines = scenario.code.replace('__THEME__', oppositeTheme).split('\n')

	return (
		<div
			className="rounded-lg overflow-hidden my-8"
			style={{ border: '1px solid var(--color-chalk-faint)' }}
		>
			{/* Code block with line highlighting */}
			<pre
				className="p-4 text-sm overflow-x-auto font-mono"
				style={{ background: 'var(--color-surface-card)' }}
			>
				<code className="font-mono">
					{lines.map((line, i) => (
						<div
							key={i}
							className="transition-colors duration-200"
							style={{
								...(currentActiveLine !== null && i !== currentActiveLine
									? { opacity: 0.3 }
									: {}),
								backgroundColor:
									i === currentActiveLine
										? 'color-mix(in srgb, var(--color-chalk) 8%, transparent)'
										: 'transparent',
								marginLeft: i === currentActiveLine ? '-1rem' : '0',
								paddingLeft: i === currentActiveLine ? 'calc(1rem - 2px)' : '0',
								borderLeft:
									i === currentActiveLine
										? '2px solid var(--color-chalk)'
										: '2px solid transparent',
								marginRight: i === currentActiveLine ? '-1rem' : '0',
								paddingRight: i === currentActiveLine ? '1rem' : '0',
							}}
						>
							{/* Safe: highlightedLines come from Shiki processing hardcoded SCENARIOS — not user input */}
							{highlightedLines[i] ? (
								<span
									dangerouslySetInnerHTML={{ __html: highlightedLines[i] }}
								/>
							) : (
								line || '\u00A0'
							)}
						</div>
					))}
				</code>
			</pre>

			{/* Action bar */}
			<div
				className="flex items-center justify-between px-4 py-2"
				style={{
					background: 'var(--color-surface-card)',
					borderTop: '1px solid var(--color-chalk-faint)',
				}}
			>
				<div className="flex items-center gap-2">
					<button
						onClick={isStepping ? stepBack : undefined}
						disabled={!isStepping || syncFrameIndex === 0}
						aria-label="Previous step"
						className="font-mono text-xs min-w-9 min-h-9 inline-flex items-center justify-center rounded"
						style={{
							color: 'var(--color-chalk)',
							background: 'var(--color-surface-card)',
							border: '1px solid var(--color-chalk-faint)',
							opacity: !isStepping || syncFrameIndex === 0 ? 0.3 : 1,
							cursor:
								!isStepping || syncFrameIndex === 0 ? 'not-allowed' : 'pointer',
						}}
					>
						<ChevronLeft size={14} />
					</button>
					<span
						className="font-mono text-[10px]"
						style={{ color: 'var(--color-chalk-dim)' }}
					>
						{isStepping
							? `${syncFrameIndex + 1} / ${syncFrameOps.length}`
							: '· · ·'}
					</span>
					<button
						onClick={() =>
							isStepping ? stepForward() : runScenario(scenarioId)
						}
						className="font-mono text-xs min-w-9 min-h-9 px-2 rounded inline-flex items-center justify-center gap-0.5"
						style={{
							color: 'var(--color-surface)',
							background: 'var(--color-chalk)',
							border: 'none',
							cursor: 'pointer',
						}}
						aria-label={
							isStepping
								? isLastStep
									? 'Finish scenario'
									: 'Next step'
								: `Start ${scenarioId} scenario`
						}
					>
						{isLastStep ? (
							<>
								<ChevronRight size={14} /> finish
							</>
						) : (
							<ChevronRight size={14} />
						)}
					</button>
				</div>
			</div>
		</div>
	)
}
