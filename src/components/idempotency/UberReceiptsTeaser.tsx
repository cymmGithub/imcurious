'use client'

import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const TOTAL_ENTRIES = 8
const FINAL_AMOUNT = 14000
const ENTRY_STAGGER = 0.22

export function UberReceiptsTeaser() {
	const ref = useRef<HTMLDivElement>(null)
	const inView = useInView(ref, { once: true, amount: 0.4 })
	const isFrozen = !!useReducedMotion()
	const isPlaying = inView && !isFrozen
	const isVisible = inView || isFrozen

	return (
		<div
			ref={ref}
			role="figure"
			aria-label="Receipts tape illustrating the March 2019 Uber Eats glitch: repeated failed payments still resulted in delivered orders. One college in India ran up roughly $14,000 in free orders in a single day."
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
				<span>March 2019</span>
			</div>

			<div className="px-4 py-3 space-y-1">
				{Array.from({ length: TOTAL_ENTRIES }).map((_, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, y: -4 }}
						animate={isVisible ? { opacity: 0.7, y: 0 } : { opacity: 0, y: -4 }}
						transition={{
							delay: isPlaying ? i * ENTRY_STAGGER : 0,
							duration: 0.3,
							ease: 'easeOut',
						}}
						className="flex items-center justify-between text-[12px]"
						style={{ color: 'var(--color-chalk)' }}
					>
						<span style={{ color: 'var(--color-chalk-dim)' }}>PAY FAILED</span>
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
				))}
				<div
					aria-hidden="true"
					className="text-[12px] tracking-widest text-center pt-1"
					style={{ color: 'var(--color-chalk-faint)' }}
				>
					· · ·
				</div>
			</div>

			<motion.div
				initial={{ opacity: 0 }}
				animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
				transition={{
					delay: isPlaying ? TOTAL_ENTRIES * ENTRY_STAGGER + 0.1 : 0,
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
					<span>one college, one day:</span>
					<CounterNumber
						to={FINAL_AMOUNT}
						durationMs={Math.max(800, TOTAL_ENTRIES * ENTRY_STAGGER * 1000)}
						play={isPlaying}
						instant={isFrozen}
						prefix="~$"
					/>
				</div>
				<div
					className="text-[11px]"
					style={{ color: 'var(--color-chalk-dim)' }}
				>
					in free food, until restaurants went offline
				</div>
			</motion.div>
		</div>
	)
}

interface CounterNumberProps {
	to: number
	durationMs: number
	play: boolean
	instant: boolean
	prefix?: string
}

function CounterNumber({
	to,
	durationMs,
	play,
	instant,
	prefix = '',
}: CounterNumberProps) {
	const [value, setValue] = useState(instant ? to : 0)
	const startedRef = useRef(false)

	useEffect(() => {
		if (instant || !play || startedRef.current) return
		startedRef.current = true
		const start = performance.now()
		let rafId = requestAnimationFrame(function tick(now) {
			const t = Math.min(1, (now - start) / durationMs)
			const eased = 1 - Math.pow(1 - t, 3)
			setValue(Math.round(to * eased))
			if (t < 1) rafId = requestAnimationFrame(tick)
		})
		return () => cancelAnimationFrame(rafId)
	}, [play, instant, to, durationMs])

	const formatted = value.toLocaleString('en-US')

	return (
		<span className="font-mono" style={{ color: '#f97316', fontWeight: 600 }}>
			{value === to ? `${prefix}${formatted}` : `${prefix}${formatted}`}
		</span>
	)
}
