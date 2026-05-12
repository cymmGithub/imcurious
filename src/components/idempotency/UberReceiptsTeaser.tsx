'use client'

import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'

const TOTAL_ENTRIES = 8
const FINAL_COUNT = 147
const ENTRY_STAGGER = 0.22

export function UberReceiptsTeaser() {
	const ref = useRef<HTMLDivElement>(null)
	const inView = useInView(ref, { once: true, amount: 0.4 })
	const prefersReducedMotion = useReducedMotion()
	const shouldAnimate = inView && !prefersReducedMotion

	// Reduced-motion users see the frozen final state immediately.
	const playState = prefersReducedMotion
		? 'frozen'
		: inView
			? 'animate'
			: 'idle'

	return (
		<div
			ref={ref}
			role="figure"
			aria-label="Receipts tape illustrating the March 2022 Uber Eats glitch: repeated failed payments still resulted in delivered orders, totalling roughly 147 free meals across about 100 cities over one weekend."
			className="my-8 rounded-md overflow-hidden font-mono"
			style={{
				background: 'var(--color-surface-card)',
				border: '1px solid var(--color-chalk-faint)',
			}}
		>
			<div
				className="flex items-center justify-between px-4 py-2 text-[10px] tracking-wider uppercase"
				style={{
					color: 'var(--color-chalk-dim)',
					borderBottom: '1px solid var(--color-chalk-faint)',
				}}
			>
				<span>Uber Eats · India</span>
				<span>March 2022</span>
			</div>

			<div className="px-4 py-3 space-y-1">
				{Array.from({ length: TOTAL_ENTRIES }).map((_, i) => {
					const delay = shouldAnimate ? i * ENTRY_STAGGER : 0
					const initial =
						playState === 'frozen'
							? { opacity: 0.7, y: 0 }
							: { opacity: 0, y: -4 }
					const animate =
						playState === 'idle'
							? { opacity: 0, y: -4 }
							: { opacity: 0.7, y: 0 }
					return (
						<motion.div
							key={i}
							initial={initial}
							animate={animate}
							transition={{ delay, duration: 0.3, ease: 'easeOut' }}
							className="flex items-center justify-between text-[12px]"
							style={{ color: 'var(--color-chalk)' }}
						>
							<span style={{ color: 'var(--color-chalk-dim)' }}>
								PAY FAILED
							</span>
							<span
								aria-hidden="true"
								style={{ color: 'var(--color-chalk-faint)' }}
							>
								──→
							</span>
							<span style={{ color: '#f97316', fontWeight: 600 }}>
								ORDER DELIVERED
							</span>
						</motion.div>
					)
				})}
				<div
					aria-hidden="true"
					className="text-[12px] tracking-widest text-center pt-1"
					style={{ color: 'var(--color-chalk-faint)' }}
				>
					· · ·
				</div>
			</div>

			<motion.div
				initial={playState === 'frozen' ? { opacity: 1 } : { opacity: 0 }}
				animate={playState === 'idle' ? { opacity: 0 } : { opacity: 1 }}
				transition={{
					delay: shouldAnimate ? TOTAL_ENTRIES * ENTRY_STAGGER + 0.1 : 0,
					duration: 0.4,
				}}
				className="px-4 py-3 text-center"
				style={{
					borderTop: '1px solid var(--color-chalk-faint)',
					color: 'var(--color-chalk)',
				}}
			>
				<div
					className="text-[12px] tracking-widest uppercase mb-1"
					style={{ color: 'var(--color-chalk-dim)' }}
				>
					tally
				</div>
				<div className="flex items-baseline justify-center gap-3 text-[14px]">
					<span>free meals served:</span>
					<CounterNumber
						from={0}
						to={FINAL_COUNT}
						durationMs={Math.max(800, TOTAL_ENTRIES * ENTRY_STAGGER * 1000)}
						play={playState !== 'idle'}
						instant={playState === 'frozen'}
					/>
				</div>
				<div
					className="text-[11px]"
					style={{ color: 'var(--color-chalk-dim)' }}
				>
					across ~100 cities · one weekend
				</div>
			</motion.div>
		</div>
	)
}

interface CounterNumberProps {
	from: number
	to: number
	durationMs: number
	play: boolean
	instant: boolean
}

function CounterNumber({
	from,
	to,
	durationMs,
	play,
	instant,
}: CounterNumberProps) {
	const ref = useRef<HTMLSpanElement>(null)
	const startedRef = useRef(false)

	useEffect(() => {
		if (instant || !play || startedRef.current) return
		startedRef.current = true
		const start = performance.now()
		let rafId = 0
		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / durationMs)
			const eased = 1 - Math.pow(1 - t, 3)
			const value = Math.round(from + (to - from) * eased)
			if (ref.current) {
				ref.current.textContent = t < 1 ? String(value) : `~${to}`
			}
			if (t < 1) rafId = requestAnimationFrame(tick)
		}
		rafId = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(rafId)
	}, [play, instant, from, to, durationMs])

	return (
		<span
			ref={ref}
			className="font-mono"
			style={{ color: '#f97316', fontWeight: 600 }}
		>
			{instant ? `~${to}` : '0'}
		</span>
	)
}
