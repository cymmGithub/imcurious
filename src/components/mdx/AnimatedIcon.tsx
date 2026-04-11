'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IdCard } from 'lucide-react'
import Image from 'next/image'

type AnimatedIdCardAnchor = 'top-right' | 'bottom-left'

export function AnimatedIdCard({
	anchor = 'top-right',
}: {
	anchor?: AnimatedIdCardAnchor
}) {
	const [isOpen, setIsOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const popoverId = useId()

	const popoverPositionClass =
		anchor === 'top-right' ? 'top-full right-0 mt-3' : 'bottom-full left-0 mb-3'
	const popoverTransformOrigin =
		anchor === 'top-right' ? 'top right' : 'bottom left'

	useEffect(() => {
		if (!isOpen) return

		const handlePointerDown = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handlePointerDown)
		document.addEventListener('keydown', handleKeyDown)

		return () => {
			document.removeEventListener('mousedown', handlePointerDown)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen])

	return (
		<div ref={containerRef} className="relative">
			<motion.button
				type="button"
				onClick={() => setIsOpen((v) => !v)}
				whileHover={{ scale: 1.15, rotate: -6 }}
				whileTap={{ scale: 0.95 }}
				transition={{ type: 'spring', stiffness: 400, damping: 15 }}
				aria-label="About the author"
				aria-haspopup="dialog"
				aria-expanded={isOpen}
				aria-controls={popoverId}
				className="text-[var(--color-chalk-faint)] hover:text-[var(--color-chalk-dim)] transition-colors cursor-pointer"
			>
				<IdCard size={22} strokeWidth={1.5} />
			</motion.button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						id={popoverId}
						role="dialog"
						aria-label="About the author"
						initial={{ opacity: 0, scale: 0.95, y: -4 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: -4 }}
						transition={{ type: 'spring', stiffness: 400, damping: 28 }}
						style={{ transformOrigin: popoverTransformOrigin }}
						className={`absolute ${popoverPositionClass} w-[380px] max-w-[calc(100vw-2rem)] p-6 rounded-md border border-[var(--color-chalk-faint)] bg-[var(--color-surface-card)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-50`}
					>
						<div className="flex flex-col items-center text-center">
							{/* Photo with decorative ring */}
							<div className="relative">
								<div
									className="absolute -inset-2 rounded-full border border-[var(--color-chalk-faint)] opacity-60"
									style={{ transform: 'rotate(-3deg)' }}
									aria-hidden="true"
								/>
								<Image
									src="/me_color.png"
									alt="Przemysław Świercz"
									width={110}
									height={110}
									className="relative rounded-full object-cover grayscale-[20%] shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
								/>
							</div>

							{/* Name */}
							<h2
								className="mt-5 font-display font-normal"
								style={{ fontSize: '1.25rem' }}
							>
								Przemysław Świercz
							</h2>

							{/* Subtitle */}
							<p
								className="mt-1 font-sketch text-[var(--color-chalk-dim)]"
								style={{ fontSize: '0.85rem' }}
							>
								Full-Stack Developer
							</p>

							{/* Divider */}
							<div
								className="my-4 h-px bg-[var(--color-chalk-faint)]"
								style={{ width: 32 }}
								aria-hidden="true"
							/>

							{/* Bio */}
							<p
								className="font-body text-[var(--color-chalk)]"
								style={{ fontSize: '0.82rem', lineHeight: 1.7 }}
							>
								I learn best by writing. When I explain something — break it
								apart, find the right words, build the right visual — it roots
								in my mind in a way that reading alone never does. This blog is
								a side effect of that process.
							</p>

							{/* Contact links */}
							<div className="mt-5 flex flex-wrap justify-center gap-5">
								<a
									href="mailto:przemswiercz@gmail.com"
									className="font-body text-[var(--color-chalk-dim)] hover:text-[var(--color-chalk)] border-b border-[var(--color-chalk-faint)] hover:border-[var(--color-chalk)] transition-colors"
									style={{
										fontSize: '0.75rem',
										letterSpacing: '0.06em',
									}}
								>
									Email
								</a>
								<a
									href="https://linkedin.com/in/przemswiercz"
									target="_blank"
									rel="noopener noreferrer"
									className="font-body text-[var(--color-chalk-dim)] hover:text-[var(--color-chalk)] border-b border-[var(--color-chalk-faint)] hover:border-[var(--color-chalk)] transition-colors"
									style={{
										fontSize: '0.75rem',
										letterSpacing: '0.06em',
									}}
								>
									LinkedIn
								</a>
								<a
									href="https://github.com/cymmGithub"
									target="_blank"
									rel="noopener noreferrer"
									className="font-body text-[var(--color-chalk-dim)] hover:text-[var(--color-chalk)] border-b border-[var(--color-chalk-faint)] hover:border-[var(--color-chalk)] transition-colors"
									style={{
										fontSize: '0.75rem',
										letterSpacing: '0.06em',
									}}
								>
									GitHub
								</a>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
