'use client'

import { useRef, useCallback, useState } from 'react'
import { useScroll, useMotionValueEvent, type MotionValue } from 'framer-motion'

const TOTAL_STAGES = 6

export interface ScrollStageResult {
	contentRef: React.RefObject<HTMLDivElement | null>
	activeStage: number
	stageProgress: number
	getStageVisibility: (stage: number) => number
	scrollYProgress: MotionValue<number>
}

export function useScrollStage(): ScrollStageResult {
	const contentRef = useRef<HTMLDivElement>(null)
	const scrollProgressRef = useRef(0)
	const [stageInfo, setStageInfo] = useState({
		activeStage: 1,
		stageProgress: 0,
	})

	const { scrollYProgress } = useScroll({
		target: contentRef,
		offset: ['start start', 'end end'],
	})

	useMotionValueEvent(scrollYProgress, 'change', (latest) => {
		scrollProgressRef.current = latest

		const stageFloat = latest * (TOTAL_STAGES - 1) + 1
		const currentStage = Math.min(Math.floor(stageFloat), TOTAL_STAGES)
		const progress = stageFloat - Math.floor(stageFloat)

		setStageInfo({
			activeStage: Math.max(1, currentStage),
			stageProgress: progress,
		})
	})

	const getStageVisibility = useCallback((stage: number): number => {
		const scrollProgress = scrollProgressRef.current
		const stageWidth = 1.0 / (TOTAL_STAGES - 1)
		// Reach 100% opacity slightly before the stage boundary so the
		// viz element is fully visible by the time the section title appears.
		const earlyOffset = stageWidth * 0.15
		const stageStart = (stage - 1) / (TOTAL_STAGES - 1) - earlyOffset
		const transitionWidth = stageWidth - earlyOffset

		if (scrollProgress >= stageStart) return 1
		if (scrollProgress >= stageStart - transitionWidth) {
			return (scrollProgress - (stageStart - transitionWidth)) / transitionWidth
		}
		return 0
	}, [])

	return {
		contentRef,
		activeStage: stageInfo.activeStage,
		stageProgress: stageInfo.stageProgress,
		getStageVisibility,
		scrollYProgress,
	}
}
