'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { RetryLabViz } from './RetryLabViz'
import { UberStoryViz } from './UberStoryViz'
import { UberStoryProvider } from './UberStoryContext'

interface RestStageProps {
	children: React.ReactNode
}

// Crossfade in pixel-space of window scrollY. Section 1 visually ends
// around 600–800px on a 900px viewport; we ramp from there into ~1300px
// so the transition lands near the Section 1 → 2 boundary.
const CROSSFADE_START_PX = 500
const CROSSFADE_END_PX = 1200

export function RestStage({ children }: RestStageProps) {
	const { scrollY } = useScroll()

	const retryOpacity = useTransform(
		scrollY,
		[CROSSFADE_START_PX, CROSSFADE_END_PX],
		[0, 1],
	)
	const uberOpacity = useTransform(
		scrollY,
		[CROSSFADE_START_PX, CROSSFADE_END_PX],
		[1, 0],
	)
	// Whichever viz is faded out must not swallow clicks on the visible one.
	const uberPointerEvents = useTransform(uberOpacity, (v) =>
		v > 0.5 ? 'auto' : 'none',
	)
	const retryPointerEvents = useTransform(retryOpacity, (v) =>
		v > 0.5 ? 'auto' : 'none',
	)

	// Pause UberStoryViz animation once it has faded out.
	const [uberActive, setUberActive] = useState(true)
	useEffect(() => {
		const unsub = uberOpacity.on('change', (v) => {
			setUberActive(v > 0.05)
		})
		return () => unsub()
	}, [uberOpacity])

	return (
		<UberStoryProvider>
			<div className="relative">
				<div className="flex flex-col lg:flex-row">
					<div className="lg:w-1/2 lg:h-screen lg:sticky lg:top-0 h-[40vh] min-h-[320px] sticky top-0 z-10 bg-surface overflow-hidden">
						<div className="relative w-full h-full">
							<motion.div
								className="absolute inset-0"
								style={{
									opacity: uberOpacity,
									pointerEvents: uberPointerEvents,
								}}
							>
								<UberStoryViz active={uberActive} />
							</motion.div>
							<motion.div
								className="absolute inset-0"
								style={{
									opacity: retryOpacity,
									pointerEvents: retryPointerEvents,
								}}
							>
								<RetryLabViz />
							</motion.div>
						</div>
					</div>

					<div className="lg:w-1/2 px-6 lg:px-12 py-8 lg:py-16 relative z-0">
						{children}
					</div>
				</div>
			</div>
		</UberStoryProvider>
	)
}
