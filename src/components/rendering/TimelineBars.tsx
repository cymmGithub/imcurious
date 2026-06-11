'use client'

import type { TimelineState } from './types'

export type TimelineMetric = 'ttfb' | 'fcp' | 'interactive'

const METRIC_LABEL: Record<TimelineMetric, string> = {
	ttfb: 'TTFB',
	fcp: 'FCP',
	interactive: 'INTERACTIVE',
}

const METRIC_COLOR: Record<TimelineMetric, string> = {
	ttfb: '#06b6d4',
	fcp: '#10b981',
	interactive: '#eab308',
}

const METRICS: TimelineMetric[] = ['ttfb', 'fcp', 'interactive']

interface TimelineBarsProps {
	timeline: TimelineState
	variant: 'lane' | 'hud'
	// The shared race clock, 0..1. At progress p a bar is filled to
	// min(p, completion time) — so every lane fills at the same rate and
	// each bar stops at its metric's (illustrative, relative) moment.
	progress?: number
	highlight?: TimelineMetric[]
}

export function TimelineBars({
	timeline,
	variant,
	progress = 1,
	highlight,
}: TimelineBarsProps) {
	const compact = variant === 'hud'
	return (
		<div className={compact ? 'space-y-1' : 'space-y-1.5'}>
			{METRICS.map((metric) => {
				const value = timeline[metric]
				const fill = value === null ? 0 : Math.min(progress, value)
				const reached = value !== null && progress >= value
				const dimmed = highlight ? !highlight.includes(metric) : false
				return (
					<div
						key={metric}
						className="flex items-center gap-2"
						style={{ opacity: dimmed ? 0.35 : 1 }}
					>
						<span
							className="font-mono flex-shrink-0 text-right"
							style={{
								fontSize: compact ? 8 : 9,
								width: compact ? 52 : 64,
								letterSpacing: '0.08em',
								color:
									highlight && !dimmed
										? METRIC_COLOR[metric]
										: 'var(--color-chalk-dim)',
								fontWeight: highlight && !dimmed ? 600 : 400,
							}}
						>
							{METRIC_LABEL[metric]}
						</span>
						<div
							className="relative flex-1 rounded-full overflow-hidden"
							style={{
								height: compact ? 5 : 7,
								background: 'var(--color-surface-card)',
								border: '1px solid var(--color-chalk-faint)',
							}}
						>
							<div
								className="absolute inset-y-0 left-0 rounded-full"
								style={{
									width: `${fill * 100}%`,
									background: METRIC_COLOR[metric],
									opacity: reached ? 1 : 0.65,
									transition: 'width 120ms linear',
								}}
							/>
						</div>
					</div>
				)
			})}
		</div>
	)
}
