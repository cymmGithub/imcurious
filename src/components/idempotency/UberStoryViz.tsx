'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useUberStory } from './UberStoryContext'

const VIEW_W = 600
const VIEW_H = 900
const VIEWBOX = `0 0 ${VIEW_W} ${VIEW_H}`

const FINAL_AMOUNT = 14000

const ORANGE = '#f97316'
const RED = '#ef4444'

// Beats: index -> duration in ms. Plays once; holds on the final beat.
const BEAT_DURATIONS = [1500, 1500, 2000, 2000, 2000, 1200]
const TOTAL_BEATS = BEAT_DURATIONS.length

// Phones are placed by center-coordinates. Phone 0 is always present;
// phones 1..6 are the "word spreads" multiplication. orderAmount keeps
// each phone's checkout total distinct so they read as different orders.
const PHONES = [
	{ id: 0, cx: 300, cy: 215, appearAt: 0, orderAmount: 240 },
	{ id: 1, cx: 165, cy: 125, appearAt: 2, orderAmount: 185 },
	{ id: 2, cx: 435, cy: 125, appearAt: 2, orderAmount: 410 },
	{ id: 3, cx: 105, cy: 250, appearAt: 2, orderAmount: 95 },
	{ id: 4, cx: 495, cy: 250, appearAt: 2, orderAmount: 320 },
	{ id: 5, cx: 215, cy: 355, appearAt: 2, orderAmount: 275 },
	{ id: 6, cx: 385, cy: 355, appearAt: 2, orderAmount: 155 },
] as const

const RESTAURANTS = [
	{ id: 0, cx: 90 },
	{ id: 1, cx: 210 },
	{ id: 2, cx: 330 },
	{ id: 3, cx: 450 },
	{ id: 4, cx: 555 },
] as const

// Tickets per restaurant grow across beat 4. Final values when overloaded.
const FINAL_TICKETS = [54, 81, 72, 96, 63]
// Order in which restaurants flip offline (indexes into RESTAURANTS).
const OFFLINE_ORDER = [2, 0, 3, 1, 4]

interface UberStoryVizProps {
	active?: boolean
}

export function UberStoryViz({ active = true }: UberStoryVizProps) {
	const prefersReduced = !!useReducedMotion()
	const { isPlaying } = useUberStory()
	const [beat, setBeat] = useState(prefersReduced ? TOTAL_BEATS - 1 : 0)
	const timerRef = useRef<number | null>(null)

	useEffect(() => {
		if (prefersReduced) return
		if (!active || !isPlaying) {
			if (timerRef.current) {
				window.clearTimeout(timerRef.current)
				timerRef.current = null
			}
			return
		}
		if (beat >= TOTAL_BEATS - 1) return
		const dur = BEAT_DURATIONS[beat]
		timerRef.current = window.setTimeout(() => {
			setBeat((b) => Math.min(b + 1, TOTAL_BEATS - 1))
		}, dur)
		return () => {
			if (timerRef.current) {
				window.clearTimeout(timerRef.current)
				timerRef.current = null
			}
		}
	}, [beat, active, isPlaying, prefersReduced])

	return (
		<div
			className="relative w-full h-full"
			role="img"
			aria-label="Animation: a single user's failed Uber Eats payment retries cascading into a $14,000 incident as word spreads, until restaurants go offline under the order volume."
		>
			<svg
				viewBox={VIEWBOX}
				className="w-full h-full"
				preserveAspectRatio="xMidYMid meet"
			>
				{/* Static title */}
				<text
					x={VIEW_W / 2}
					y={50}
					textAnchor="middle"
					fontFamily="var(--font-mono, ui-monospace, monospace)"
					fontSize={16}
					fill="var(--color-chalk-dim)"
				>
					{'// Sunday afternoon, March 2019'}
				</text>

				{/* Phones region (top zone) */}
				<g>
					{PHONES.map((p) => (
						<Phone
							key={p.id}
							cx={p.cx}
							cy={p.cy}
							visible={beat >= p.appearAt}
							showPostArrow={
								// phone 0 fires in beat 1; copies fire in beat 2 with stagger
								(p.id === 0 && beat >= 1) || (p.id > 0 && beat >= 2)
							}
							showFood={(p.id === 0 && beat >= 1) || (p.id > 0 && beat >= 2)}
							staggerDelay={p.id === 0 ? 0 : 0.15 + p.id * 0.1}
							failed={beat === 0 && p.id === 0}
							orderAmount={p.orderAmount}
						/>
					))}
				</g>

				{/* Counter zone */}
				<g>
					<motion.text
						x={VIEW_W / 2}
						y={510}
						textAnchor="middle"
						fontFamily="var(--font-mono, ui-monospace, monospace)"
						fontSize={14}
						fill="var(--color-chalk-faint)"
						initial={{ opacity: 0 }}
						animate={{ opacity: beat >= 3 ? 1 : 0.25 }}
						transition={{ duration: 0.4 }}
					>
						UNPAID TOTAL
					</motion.text>
					<motion.g
						animate={{ scale: beat >= 3 ? 1 : 0.85 }}
						transition={{ duration: 0.5, ease: 'easeOut' }}
						style={{ transformOrigin: `${VIEW_W / 2}px 565px` }}
					>
						<Counter
							x={VIEW_W / 2}
							y={565}
							to={FINAL_AMOUNT}
							play={beat >= 3 && !prefersReduced}
							instant={prefersReduced || beat > 3}
							pre={beat < 3}
						/>
					</motion.g>
					<motion.text
						x={VIEW_W / 2}
						y={605}
						textAnchor="middle"
						fontFamily="var(--font-mono, ui-monospace, monospace)"
						fontSize={13}
						fill="var(--color-chalk-dim)"
						initial={{ opacity: 0 }}
						animate={{ opacity: beat >= 3 ? 1 : 0 }}
						transition={{ duration: 0.4 }}
					>
						in free food
					</motion.text>
				</g>

				{/* Restaurants row */}
				<g>
					<motion.text
						x={VIEW_W / 2}
						y={665}
						textAnchor="middle"
						fontFamily="var(--font-mono, ui-monospace, monospace)"
						fontSize={12}
						fill="var(--color-chalk-faint)"
						animate={{ opacity: beat >= 4 ? 1 : 0.3 }}
					>
						RESTAURANTS
					</motion.text>
					{RESTAURANTS.map((r, i) => {
						const tickets = beat >= 4 ? FINAL_TICKETS[i] : 0
						const offlineRank = OFFLINE_ORDER.indexOf(i)
						// In beat 4, restaurants progressively go offline in OFFLINE_ORDER.
						// We simulate that with sub-beat fractions, but since beats are
						// discrete here, simply flip them by beat 5.
						const isOffline = beat >= 5 || (beat === 4 && offlineRank <= 1)
						return (
							<Restaurant
								key={r.id}
								cx={r.cx}
								tickets={tickets}
								offline={isOffline}
							/>
						)
					})}
				</g>
			</svg>
		</div>
	)
}

// ---------- Phone ----------

const PHONE_W = 60
const PHONE_H = 100

interface PhoneProps {
	cx: number
	cy: number
	visible: boolean
	showPostArrow: boolean
	showFood: boolean
	staggerDelay: number
	failed: boolean
	orderAmount: number
}

function Phone({
	cx,
	cy,
	visible,
	showPostArrow,
	showFood,
	staggerDelay,
	failed,
	orderAmount,
}: PhoneProps) {
	const { start } = useUberStory()
	const x = cx - PHONE_W / 2
	const y = cy - PHONE_H / 2
	const screenX = x + 6
	const screenY = y + 10
	const screenW = PHONE_W - 12
	const screenH = PHONE_H - 20

	return (
		<motion.g
			initial={{ opacity: 0, scale: 0.7 }}
			animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.7 }}
			transition={{ duration: 0.4, delay: visible ? staggerDelay : 0 }}
		>
			{/* Phone body */}
			<rect
				x={x}
				y={y}
				width={PHONE_W}
				height={PHONE_H}
				rx={8}
				fill="var(--color-surface-card)"
				stroke="var(--color-chalk-faint)"
				strokeWidth={1.5}
			/>
			{/* Screen */}
			<rect
				x={screenX}
				y={screenY}
				width={screenW}
				height={screenH}
				rx={2}
				fill="var(--color-surface)"
			/>
			{/* Uber Eats header band */}
			<rect x={screenX} y={screenY} width={screenW} height={12} fill="#000" />
			<text
				x={cx}
				y={screenY + 8.5}
				textAnchor="middle"
				fontFamily="var(--font-body, ui-sans-serif, sans-serif)"
				fontSize={7}
				fontWeight={800}
				letterSpacing="-0.2"
				fill="#fff"
			>
				Uber Eats
			</text>
			{/* Order label */}
			<text
				x={cx}
				y={screenY + 22}
				textAnchor="middle"
				fontFamily="var(--font-mono, ui-monospace, monospace)"
				fontSize={5}
				letterSpacing="0.5"
				fill="var(--color-chalk-dim)"
			>
				ORDER
			</text>
			{/* Order amount */}
			<text
				x={cx}
				y={screenY + 32}
				textAnchor="middle"
				fontFamily="var(--font-mono, ui-monospace, monospace)"
				fontSize={9}
				fontWeight={700}
				fill="var(--color-chalk)"
			>
				₹{orderAmount}
			</text>
			{/* Failed badge */}
			<motion.g
				initial={{ opacity: 0 }}
				animate={{ opacity: failed ? 1 : 0.6 }}
			>
				<rect
					x={screenX + 4}
					y={screenY + 34}
					width={screenW - 8}
					height={10}
					rx={2}
					fill={RED}
					opacity={0.18}
				/>
				<text
					x={cx}
					y={screenY + 42}
					textAnchor="middle"
					fontFamily="var(--font-mono, ui-monospace, monospace)"
					fontSize={6}
					fontWeight={700}
					fill={RED}
				>
					FAILED
				</text>
			</motion.g>
			{/* Retry button — also a click target when in idle/failed state */}
			<motion.g
				onClick={failed ? start : undefined}
				role={failed ? 'button' : undefined}
				aria-label={failed ? 'Play the Uber Eats cascade animation' : undefined}
				tabIndex={failed ? 0 : undefined}
				style={{ cursor: failed ? 'pointer' : 'default' }}
				animate={{ opacity: failed ? [0.4, 1, 0.4] : 0.6 }}
				transition={{
					repeat: failed ? Infinity : 0,
					duration: 1.2,
					ease: 'easeInOut',
				}}
			>
				<rect
					x={screenX + 3}
					y={screenY + 50}
					width={screenW - 6}
					height={12}
					rx={3}
					fill={ORANGE}
					opacity={0.85}
				/>
				<text
					x={cx}
					y={screenY + 59}
					textAnchor="middle"
					fontFamily="var(--font-mono, ui-monospace, monospace)"
					fontSize={6}
					fontWeight={700}
					fill="#1a1108"
					style={{ pointerEvents: 'none' }}
				>
					ORDER AGAIN
				</text>
			</motion.g>

			{/* POST arrow (request leaving phone) */}
			{showPostArrow && (
				<motion.g
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: staggerDelay + 0.05, duration: 0.3 }}
				>
					<motion.path
						d={`M ${cx + PHONE_W / 2 - 2} ${cy} Q ${cx + PHONE_W / 2 + 18} ${cy - 6}, ${cx + PHONE_W / 2 + 32} ${cy - 4}`}
						stroke={ORANGE}
						strokeWidth={1.5}
						strokeDasharray="3 3"
						fill="none"
						initial={{ pathLength: 0 }}
						animate={{ pathLength: 1 }}
						transition={{ delay: staggerDelay + 0.1, duration: 0.5 }}
					/>
					<motion.text
						x={cx + PHONE_W / 2 + 4}
						y={cy - 10}
						fontFamily="var(--font-mono, ui-monospace, monospace)"
						fontSize={7}
						fill={ORANGE}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: staggerDelay + 0.3, duration: 0.2 }}
					>
						POST
					</motion.text>
				</motion.g>
			)}

			{/* Food box (delivered anyway) */}
			{showFood && (
				<motion.g
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: staggerDelay + 0.4, duration: 0.4 }}
				>
					<rect
						x={cx + PHONE_W / 2 + 28}
						y={cy - 5}
						width={20}
						height={16}
						rx={2}
						fill={ORANGE}
						opacity={0.95}
					/>
					<rect
						x={cx + PHONE_W / 2 + 28}
						y={cy - 5}
						width={20}
						height={4}
						rx={1}
						fill="#1a1108"
						opacity={0.35}
					/>
					{/* steam */}
					<path
						d={`M ${cx + PHONE_W / 2 + 33} ${cy - 9} q -2 -3, 0 -5 q 2 -2, 0 -5`}
						stroke={ORANGE}
						strokeWidth={1}
						fill="none"
						opacity={0.6}
					/>
					<path
						d={`M ${cx + PHONE_W / 2 + 40} ${cy - 9} q -2 -3, 0 -5 q 2 -2, 0 -5`}
						stroke={ORANGE}
						strokeWidth={1}
						fill="none"
						opacity={0.4}
					/>
				</motion.g>
			)}
		</motion.g>
	)
}

// ---------- Counter ----------

interface CounterProps {
	x: number
	y: number
	to: number
	play: boolean
	instant: boolean
	pre: boolean
}

function Counter({ x, y, to, play, instant, pre }: CounterProps) {
	const [value, setValue] = useState(instant ? to : 0)
	const startedRef = useRef(false)

	useEffect(() => {
		if (instant) {
			setValue(to)
			return
		}
		if (!play) {
			setValue(0)
			startedRef.current = false
			return
		}
		if (startedRef.current) return
		startedRef.current = true
		const start = performance.now()
		const duration = 1800
		let rafId = requestAnimationFrame(function tick(now) {
			const t = Math.min(1, (now - start) / duration)
			const eased = 1 - Math.pow(1 - t, 3)
			setValue(Math.round(to * eased))
			if (t < 1) rafId = requestAnimationFrame(tick)
		})
		return () => cancelAnimationFrame(rafId)
	}, [play, instant, to])

	const formatted = pre ? '$0' : `$${value.toLocaleString('en-US')}`

	return (
		<text
			x={x}
			y={y}
			textAnchor="middle"
			fontFamily="var(--font-mono, ui-monospace, monospace)"
			fontSize={56}
			fontWeight={700}
			fill={ORANGE}
		>
			{formatted}
		</text>
	)
}

// ---------- Restaurant ----------

const REST_W = 80
const REST_H = 100

interface RestaurantProps {
	cx: number
	tickets: number
	offline: boolean
}

function Restaurant({ cx, tickets, offline }: RestaurantProps) {
	const x = cx - REST_W / 2
	const baseY = 690
	const roofH = 18
	const bodyY = baseY + roofH
	const bodyH = REST_H - roofH
	const awningH = 12

	const windowFill = offline ? '#1a1108' : '#fde68a'
	const doorFill = offline ? '#0f0a06' : '#3a2515'
	const awningFill = offline ? '#5a2020' : ORANGE

	return (
		<motion.g
			animate={{ opacity: offline ? 0.7 : 1 }}
			transition={{ duration: 0.6 }}
		>
			{/* Roof */}
			<polygon
				points={`${x - 2},${bodyY} ${cx},${baseY} ${x + REST_W + 2},${bodyY}`}
				fill={offline ? '#2a1a12' : '#3a2515'}
				stroke="var(--color-chalk-faint)"
				strokeWidth={1}
				strokeLinejoin="round"
			/>
			{/* Building body */}
			<rect
				x={x}
				y={bodyY}
				width={REST_W}
				height={bodyH}
				fill={offline ? '#2a1a14' : 'var(--color-surface-card)'}
				stroke="var(--color-chalk-faint)"
				strokeWidth={1.5}
			/>
			{/* Awning (striped) */}
			<rect
				x={x}
				y={bodyY}
				width={REST_W}
				height={awningH}
				fill={awningFill}
				opacity={offline ? 0.6 : 1}
			/>
			{[1, 2, 3, 4].map((i) => (
				<line
					key={i}
					x1={x + (i * REST_W) / 5}
					x2={x + (i * REST_W) / 5}
					y1={bodyY}
					y2={bodyY + awningH}
					stroke="#fff"
					strokeWidth={0.7}
					opacity={offline ? 0.15 : 0.4}
				/>
			))}
			{/* Awning bottom scallop (zigzag) */}
			<polyline
				points={Array.from({ length: 9 }, (_, i) => {
					const px = x + (i * REST_W) / 8
					const py = bodyY + awningH + (i % 2 === 0 ? 0 : 3)
					return `${px},${py}`
				}).join(' ')}
				fill="none"
				stroke={awningFill}
				strokeWidth={1.2}
				opacity={offline ? 0.5 : 1}
			/>

			{/* Left window */}
			<rect
				x={x + 8}
				y={bodyY + awningH + 8}
				width={20}
				height={20}
				fill={windowFill}
				stroke="var(--color-chalk-faint)"
				strokeWidth={1}
			/>
			{/* Window mullion */}
			<line
				x1={x + 18}
				x2={x + 18}
				y1={bodyY + awningH + 8}
				y2={bodyY + awningH + 28}
				stroke="var(--color-chalk-faint)"
				strokeWidth={0.6}
			/>
			<line
				x1={x + 8}
				x2={x + 28}
				y1={bodyY + awningH + 18}
				y2={bodyY + awningH + 18}
				stroke="var(--color-chalk-faint)"
				strokeWidth={0.6}
			/>

			{/* Right window */}
			<rect
				x={x + REST_W - 28}
				y={bodyY + awningH + 8}
				width={20}
				height={20}
				fill={windowFill}
				stroke="var(--color-chalk-faint)"
				strokeWidth={1}
			/>
			<line
				x1={x + REST_W - 18}
				x2={x + REST_W - 18}
				y1={bodyY + awningH + 8}
				y2={bodyY + awningH + 28}
				stroke="var(--color-chalk-faint)"
				strokeWidth={0.6}
			/>
			<line
				x1={x + REST_W - 28}
				x2={x + REST_W - 8}
				y1={bodyY + awningH + 18}
				y2={bodyY + awningH + 18}
				stroke="var(--color-chalk-faint)"
				strokeWidth={0.6}
			/>

			{/* Door */}
			<rect
				x={cx - 9}
				y={bodyY + awningH + 32}
				width={18}
				height={bodyH - awningH - 32}
				fill={doorFill}
				stroke="var(--color-chalk-faint)"
				strokeWidth={1}
			/>
			{/* Door knob */}
			<circle
				cx={cx + 5}
				cy={bodyY + awningH + 32 + (bodyH - awningH - 32) / 2}
				r={1}
				fill={offline ? '#3a2515' : ORANGE}
			/>

			{/* Order count badge (busy, not yet offline) */}
			{!offline && tickets > 0 && (
				<motion.g
					initial={{ opacity: 0, scale: 0 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.4, ease: 'backOut' }}
				>
					<circle
						cx={x + REST_W - 4}
						cy={baseY + 4}
						r={12}
						fill={tickets > 60 ? RED : ORANGE}
						stroke="var(--color-surface)"
						strokeWidth={1.5}
					/>
					<text
						x={x + REST_W - 4}
						y={baseY + 8}
						textAnchor="middle"
						fontFamily="var(--font-mono, ui-monospace, monospace)"
						fontSize={9}
						fontWeight={700}
						fill="#fff"
					>
						+{tickets}
					</text>
				</motion.g>
			)}

			{/* CLOSED sign hanging from awning */}
			{offline && (
				<motion.g
					initial={{ opacity: 0, y: -4 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					{/* hanging chain */}
					<line
						x1={cx}
						x2={cx}
						y1={bodyY + awningH + 3}
						y2={bodyY + awningH + 8}
						stroke="var(--color-chalk-faint)"
						strokeWidth={0.8}
					/>
					<rect
						x={cx - 20}
						y={bodyY + awningH + 8}
						width={40}
						height={16}
						fill="#0a0908"
						stroke={RED}
						strokeWidth={1.2}
					/>
					<text
						x={cx}
						y={bodyY + awningH + 19}
						textAnchor="middle"
						fontFamily="var(--font-mono, ui-monospace, monospace)"
						fontSize={8}
						fontWeight={800}
						letterSpacing="0.5"
						fill={RED}
					>
						CLOSED
					</text>
				</motion.g>
			)}
		</motion.g>
	)
}
