'use client'

import {
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
	type ReactNode,
} from 'react'

interface FootnoteProps {
	children: ReactNode
	note: ReactNode
}

interface ComputedPos {
	left: number // tooltip's left, relative to wrap (containing block)
	arrowLeft: number // caret's left within the tooltip
	width: number // tooltip width in px
}

const VIEWPORT_MARGIN = 16
const TOOLTIP_MAX_WIDTH = 280

export function Footnote({ children, note }: FootnoteProps) {
	const [open, setOpen] = useState(false)
	const [pos, setPos] = useState<ComputedPos | null>(null)
	const wrapRef = useRef<HTMLSpanElement>(null)
	const buttonRef = useRef<HTMLButtonElement>(null)
	const tooltipId = useId()

	useEffect(() => {
		if (!open) {
			setPos(null)
			return
		}
		const onMouseDown = (e: MouseEvent) => {
			if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
				setOpen(false)
			}
		}
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false)
		}
		document.addEventListener('mousedown', onMouseDown)
		window.addEventListener('keydown', onKeyDown)
		return () => {
			document.removeEventListener('mousedown', onMouseDown)
			window.removeEventListener('keydown', onKeyDown)
		}
	}, [open])

	// Position the tooltip horizontally so it stays inside the viewport.
	// Caret offsets back to the trigger's center, even when the tooltip is
	// shifted to avoid an edge.
	useLayoutEffect(() => {
		if (!open) return
		const compute = () => {
			const wrap = wrapRef.current
			const btn = buttonRef.current
			if (!wrap || !btn) return
			const wrapRect = wrap.getBoundingClientRect()
			const btnRect = btn.getBoundingClientRect()
			const vw = window.innerWidth
			const width = Math.min(TOOLTIP_MAX_WIDTH, vw - 2 * VIEWPORT_MARGIN)
			const triggerCenterVW = btnRect.left + btnRect.width / 2
			let leftVW = triggerCenterVW - width / 2
			if (leftVW < VIEWPORT_MARGIN) leftVW = VIEWPORT_MARGIN
			if (leftVW + width > vw - VIEWPORT_MARGIN) {
				leftVW = vw - VIEWPORT_MARGIN - width
			}
			setPos({
				left: leftVW - wrapRect.left,
				arrowLeft: triggerCenterVW - leftVW,
				width,
			})
		}
		compute()
		window.addEventListener('resize', compute)
		return () => window.removeEventListener('resize', compute)
	}, [open])

	return (
		<span ref={wrapRef} className="relative inline-block">
			<button
				ref={buttonRef}
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-describedby={open ? tooltipId : undefined}
				className="cursor-pointer transition-colors"
				style={{
					color: 'inherit',
					background: 'transparent',
					border: 'none',
					padding: 0,
					font: 'inherit',
					fontWeight: 700,
					textDecoration: 'underline',
					textDecorationStyle: 'dashed',
					textDecorationColor: '#f97316',
					textDecorationThickness: '1.5px',
					textUnderlineOffset: '4px',
				}}
			>
				{children}
				<sup
					style={{
						fontSize: 'smaller',
						marginLeft: '1px',
						color: 'var(--color-chalk-dim)',
					}}
				>
					*
				</sup>
			</button>

			{open && (
				<span
					id={tooltipId}
					role="tooltip"
					className="absolute not-italic font-normal"
					style={{
						top: 'calc(100% + 10px)',
						left: pos ? `${pos.left}px` : 0,
						width: pos
							? `${pos.width}px`
							: `min(${TOOLTIP_MAX_WIDTH}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`,
						visibility: pos ? 'visible' : 'hidden',
						background: 'var(--color-surface-card)',
						border: '1px solid var(--color-chalk-faint)',
						borderRadius: '4px',
						padding: '10px 12px',
						fontSize: '13px',
						lineHeight: 1.5,
						color: 'var(--color-chalk)',
						zIndex: 50,
						boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
					}}
				>
					{/* caret pointing up at the trigger */}
					<span
						aria-hidden="true"
						className="absolute"
						style={{
							top: '-6px',
							left: pos ? `${pos.arrowLeft}px` : '50%',
							transform: 'translateX(-50%)',
							width: 0,
							height: 0,
							borderLeft: '6px solid transparent',
							borderRight: '6px solid transparent',
							borderBottom: '6px solid var(--color-chalk-faint)',
						}}
					/>
					<span
						aria-hidden="true"
						className="absolute"
						style={{
							top: '-5px',
							left: pos ? `${pos.arrowLeft}px` : '50%',
							transform: 'translateX(-50%)',
							width: 0,
							height: 0,
							borderLeft: '5px solid transparent',
							borderRight: '5px solid transparent',
							borderBottom: '5px solid var(--color-surface-card)',
						}}
					/>
					{note}
				</span>
			)}
		</span>
	)
}
