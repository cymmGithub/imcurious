'use client'

import { useEffect, useRef, useState } from 'react'

// Fraction of viewport height where a section "activates" — roughly where a
// reader's eyes sit when a heading scrolls up into reading position.
const ACTIVATION_LINE = 0.38

export interface SectionStageResult {
	contentRef: React.RefObject<HTMLDivElement | null>
	activeStage: number
}

export interface SectionOffset {
	stage: number
	top: number
}

// Pure stage resolution, exported for tests: given the sections' document-space
// tops (sorted ascending) and the activation line's document-space y, the
// active stage is the deepest section whose top the line has crossed.
export function resolveStage(sections: SectionOffset[], line: number): number {
	let active = sections[0]?.stage ?? 1
	for (const s of sections) {
		if (line >= s.top) active = s.stage
		else break
	}
	return active
}

// Section-boundary alternative to useScrollStage: the active stage follows the
// actual positions of `[data-stage]` elements instead of dividing total scroll
// progress uniformly — sections of different lengths activate exactly when the
// reader reaches them.
export function useSectionStage(totalStages: number): SectionStageResult {
	const contentRef = useRef<HTMLDivElement>(null)
	const [activeStage, setActiveStage] = useState(1)

	useEffect(() => {
		const root = contentRef.current
		if (!root) return

		let sections: SectionOffset[] = []

		const measure = () => {
			sections = Array.from(root.querySelectorAll<HTMLElement>('[data-stage]'))
				.map((el) => ({
					stage: Math.max(1, Math.min(Number(el.dataset.stage), totalStages)),
					top: el.getBoundingClientRect().top + window.scrollY,
				}))
				.filter((s) => Number.isFinite(s.top) && Number.isFinite(s.stage))
				.sort((a, b) => a.top - b.top)
		}

		const update = () => {
			const line = window.scrollY + window.innerHeight * ACTIVATION_LINE
			setActiveStage(resolveStage(sections, line))
		}

		const remeasure = () => {
			measure()
			update()
		}

		remeasure()
		window.addEventListener('scroll', update, { passive: true })
		window.addEventListener('resize', remeasure)
		// Content height changes (fonts, images, late hydration) shift offsets.
		const observer = new ResizeObserver(remeasure)
		observer.observe(root)

		return () => {
			window.removeEventListener('scroll', update)
			window.removeEventListener('resize', remeasure)
			observer.disconnect()
		}
	}, [totalStages])

	return { contentRef, activeStage }
}
