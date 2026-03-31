'use client'

import { useState, useEffect } from 'react'
import { useEventLoopStore } from '@/stores/eventLoopStore'
import {
	STATIC_HIGHLIGHTS_DARK,
	STATIC_HIGHLIGHTS_LIGHT,
} from '@/lib/__generated__/staticHighlights'
import { Play } from 'lucide-react'

function useTheme(): 'dark' | 'light' {
	const [theme, setTheme] = useState<'dark' | 'light'>('dark')

	useEffect(() => {
		const html = document.documentElement
		const read = () => (html.dataset.theme === 'light' ? 'light' : 'dark')
		setTheme(read())

		const observer = new MutationObserver(() => setTheme(read()))
		observer.observe(html, {
			attributes: true,
			attributeFilter: ['data-theme'],
		})
		return () => observer.disconnect()
	}, [])

	return theme
}

const DEMO_CONFIG: Record<
	string,
	{ running: string; idle: string; caveat: string }
> = {
	'blocking-while-loop': {
		running: 'Frozen',
		idle: 'Run',
		caveat: '',
	},
	'infinite-microtasks': {
		running: 'Starving',
		idle: 'Run',
		caveat:
			"This would starve the loop forever — we're stopping it early so your tab doesn't die.",
	},
}

interface DemoCodeProps {
	id: string
}

export function DemoCode({ id }: DemoCodeProps) {
	const theme = useTheme()
	const html =
		theme === 'light' ? STATIC_HIGHLIGHTS_LIGHT[id] : STATIC_HIGHLIGHTS_DARK[id]
	const activeScenarioId = useEventLoopStore((s) => s.activeScenarioId)
	const executionTimer = useEventLoopStore((s) => s.executionTimer)
	const runDemo = useEventLoopStore((s) => s.runDemo)

	if (!html) return null

	const isActive = activeScenarioId === id
	const config = DEMO_CONFIG[id] ?? {
		running: 'Running',
		idle: 'Run',
		caveat: '',
	}
	const secondsLeft = isActive ? Math.ceil(executionTimer / 1000) : 0

	return (
		<div
			className="rounded-lg overflow-hidden my-8 transition-all duration-300"
			style={{
				border: isActive
					? '1px solid color-mix(in srgb, #ef4444 60%, transparent)'
					: '1px solid var(--color-chalk-faint)',
				boxShadow: isActive
					? '0 0 20px color-mix(in srgb, #ef4444 15%, transparent)'
					: 'none',
			}}
		>
			{/* Code block */}
			<div
				className="p-4 text-sm overflow-x-auto font-mono [&_pre]:!bg-transparent [&_code]:!bg-transparent"
				style={{ background: 'var(--color-surface-card)' }}
				/* Safe: html comes from Shiki processing hardcoded STATIC_CODES at build time */
				dangerouslySetInnerHTML={{ __html: html }}
			/>

			{/* Action bar */}
			<div
				className="flex items-center px-4 py-2"
				style={{
					background: 'var(--color-surface-card)',
					borderTop: '1px solid var(--color-chalk-faint)',
				}}
			>
				<button
					onClick={() => runDemo(id)}
					disabled={activeScenarioId !== null}
					className="font-mono text-xs px-3 min-h-9 rounded inline-flex items-center justify-center gap-1.5 transition-opacity duration-200"
					style={{
						color: isActive ? '#ef4444' : 'var(--color-surface)',
						background: isActive
							? 'color-mix(in srgb, #ef4444 12%, transparent)'
							: 'var(--color-chalk)',
						border: isActive ? '1px solid #ef4444' : 'none',
						opacity: activeScenarioId !== null && !isActive ? 0.3 : 1,
						cursor: activeScenarioId !== null ? 'not-allowed' : 'pointer',
					}}
					aria-label={
						isActive
							? `${config.running} — ${secondsLeft}s remaining`
							: `Run ${id} demo`
					}
				>
					{isActive ? (
						<>
							{config.running}... {secondsLeft}s
						</>
					) : (
						<>
							<Play size={12} /> {config.idle}
						</>
					)}
				</button>
				{isActive && (
					<span
						className="font-body text-[11px] ml-3 italic"
						style={{
							color: 'color-mix(in srgb, #ef4444 70%, var(--color-chalk))',
						}}
					>
						{config.caveat}
					</span>
				)}
			</div>
		</div>
	)
}
