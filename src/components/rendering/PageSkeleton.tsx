'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
	BLOCK_IDS,
	type BlockId,
	type BlockOrigin,
	type BlocksState,
	type PaintState,
} from './types'

// Local coordinate system of the block grid — rendered at scale via the
// `scale` prop so the same component serves the browser viewport and the
// compact race-lane thumbnails.
export const SKELETON_WIDTH = 276
export const SKELETON_HEIGHT = 282

type BlockRect = { x: number; y: number; width: number; height: number }

const BLOCK_RECTS: Record<BlockId, BlockRect> = {
	header: { x: 0, y: 0, width: 276, height: 42 },
	nav: { x: 0, y: 50, width: 56, height: 128 },
	content: { x: 64, y: 50, width: 142, height: 128 },
	sidebar: { x: 214, y: 50, width: 62, height: 128 },
	comments: { x: 0, y: 186, width: 276, height: 96 },
}

export const ORIGIN_COLORS: Record<BlockOrigin, string> = {
	static: '#14b8a6',
	server: '#f97316',
	client: '#3b82f6',
}

function contentLines(
	rect: BlockRect,
): { x1: number; x2: number; y: number }[] {
	const pad = 10
	const usable = rect.height - pad * 2
	const count = Math.max(1, Math.min(3, Math.floor(usable / 16)))
	const lines = []
	for (let i = 0; i < count; i++) {
		const y = rect.y + pad + 6 + (i * usable) / count
		const shorten = i === count - 1 ? 0.35 : 0.12
		lines.push({
			x1: rect.x + pad,
			x2: rect.x + rect.width - pad - rect.width * shorten,
			y,
		})
	}
	return lines
}

interface BlockProps {
	id: BlockId
	paint: PaintState
	origin?: BlockOrigin
	compact: boolean
}

function Block({ id, paint, origin, compact }: BlockProps) {
	const rect = BLOCK_RECTS[id]
	const reducedMotion = useReducedMotion()
	const originColor = origin ? ORIGIN_COLORS[origin] : undefined

	const stroke =
		originColor ??
		(paint === 'hydrated'
			? 'var(--color-chalk)'
			: paint === 'empty'
				? 'var(--color-chalk-faint)'
				: 'var(--color-chalk-faint)')

	if (paint === 'empty') {
		return (
			<rect
				{...rect}
				rx={4}
				fill="none"
				stroke={stroke}
				strokeWidth={compact ? 1 : 1.2}
				strokeDasharray="5 5"
				opacity={origin ? 0.7 : 0.45}
			/>
		)
	}

	if (paint === 'fallback') {
		return (
			<g>
				<motion.rect
					{...rect}
					rx={4}
					fill="var(--color-surface-card)"
					stroke={stroke}
					strokeWidth={compact ? 1 : 1.2}
					strokeDasharray="5 5"
					initial={false}
					animate={
						reducedMotion ? { opacity: 0.7 } : { opacity: [0.4, 0.85, 0.4] }
					}
					transition={
						reducedMotion
							? undefined
							: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
					}
				/>
				{contentLines(rect).map((l, i) => (
					<line
						key={i}
						x1={l.x1}
						x2={l.x2}
						y1={l.y}
						y2={l.y}
						stroke="var(--color-chalk-faint)"
						strokeWidth={compact ? 2 : 3}
						strokeLinecap="round"
						strokeDasharray="2 6"
						opacity={0.5}
					/>
				))}
			</g>
		)
	}

	const isHydrated = paint === 'hydrated'

	return (
		<g>
			<rect
				{...rect}
				rx={4}
				fill="var(--color-surface-card)"
				stroke={stroke}
				strokeWidth={compact ? 1 : isHydrated ? 1.6 : 1.2}
				opacity={isHydrated ? 1 : 0.75}
			/>
			{contentLines(rect).map((l, i) => (
				<line
					key={i}
					x1={l.x1}
					x2={l.x2}
					y1={l.y}
					y2={l.y}
					stroke={isHydrated ? 'var(--color-chalk)' : 'var(--color-chalk-dim)'}
					strokeWidth={compact ? 2 : 3}
					strokeLinecap="round"
					opacity={isHydrated ? 0.9 : 0.55}
				/>
			))}
			{/* The inert-vs-alive cue: hydrated blocks carry a live dot. */}
			{isHydrated && (
				<circle
					cx={rect.x + rect.width - 8}
					cy={rect.y + 8}
					r={compact ? 2.5 : 3.5}
					fill="#22c55e"
				/>
			)}
		</g>
	)
}

interface PageSkeletonProps {
	blocks: BlocksState
	x?: number
	y?: number
	scale?: number
	compact?: boolean
}

export function PageSkeleton({
	blocks,
	x = 0,
	y = 0,
	scale = 1,
	compact = false,
}: PageSkeletonProps) {
	return (
		<g transform={`translate(${x} ${y}) scale(${scale})`}>
			{BLOCK_IDS.map((id) => (
				<Block
					key={id}
					id={id}
					paint={blocks[id].paint}
					origin={blocks[id].origin}
					compact={compact}
				/>
			))}
			{!compact &&
				BLOCK_IDS.map((id) => {
					const rect = BLOCK_RECTS[id]
					return (
						<text
							key={`label-${id}`}
							x={rect.x + 6}
							y={rect.y + 13}
							fontSize={8}
							fontFamily="var(--font-mono, ui-monospace, monospace)"
							fill="var(--color-chalk-dim)"
							letterSpacing="0.12em"
							opacity={blocks[id].paint === 'empty' ? 0.5 : 0.8}
						>
							{id.toUpperCase()}
						</text>
					)
				})}
		</g>
	)
}
