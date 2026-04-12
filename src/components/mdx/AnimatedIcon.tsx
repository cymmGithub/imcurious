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
						className={`absolute ${popoverPositionClass} w-[300px] sm:w-[380px] max-w-[calc(100vw-2rem)] p-4 sm:p-6 rounded-md border border-[var(--color-chalk-faint)] bg-[var(--color-surface-card)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-50`}
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
									className="relative rounded-full object-cover grayscale-[20%] shadow-[0_8px_30px_rgba(0,0,0,0.08)] w-[80px] h-[80px] sm:w-[110px] sm:h-[110px]"
								/>
							</div>

							{/* Name */}
							<h2
								className="mt-3 sm:mt-5 font-display font-normal text-[1.05rem] sm:text-[1.25rem]"
							>
								Przemysław Świercz
							</h2>

							{/* Subtitle */}
							<p
								className="mt-1 font-sketch text-[var(--color-chalk-dim)] text-[0.78rem] sm:text-[0.85rem]"
							>
								Full-Stack Developer
							</p>

							{/* Divider */}
							<div
								className="my-3 sm:my-4 h-px bg-[var(--color-chalk-faint)]"
								style={{ width: 32 }}
								aria-hidden="true"
							/>

							{/* Bio */}
							<p
								className="font-body text-[var(--color-chalk)] text-[0.75rem] sm:text-[0.82rem]"
								style={{ lineHeight: 1.7 }}
							>
								I learn best by writing. When I explain something — break it
								apart, find the right words, build the right visual — it roots
								in my mind in a way that reading alone never does. This blog is
								a side effect of that process.
							</p>

							{/* Contact links */}
							<div className="mt-3 sm:mt-5 flex justify-center gap-5">
								<a
									href="mailto:przemswiercz@gmail.com"
									aria-label="Email"
									className="text-[var(--color-chalk-dim)] hover:text-[var(--color-chalk)] transition-colors"
								>
									<svg
										width={18}
										height={18}
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth={1.5}
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<rect width="20" height="16" x="2" y="4" rx="2" />
										<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
									</svg>
								</a>
								<a
									href="https://linkedin.com/in/przemswiercz"
									target="_blank"
									rel="noopener noreferrer"
									aria-label="LinkedIn"
									className="text-[var(--color-chalk-dim)] hover:text-[var(--color-chalk)] transition-colors"
								>
									<svg
										width={18}
										height={18}
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
									</svg>
								</a>
								<a
									href="https://github.com/cymmGithub"
									target="_blank"
									rel="noopener noreferrer"
									aria-label="GitHub"
									className="text-[var(--color-chalk-dim)] hover:text-[var(--color-chalk)] transition-colors"
								>
									<svg
										width={18}
										height={18}
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
									</svg>
								</a>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
