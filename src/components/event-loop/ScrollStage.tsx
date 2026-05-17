'use client'

import { useScrollStage } from '@/hooks/useScrollStage'
import { EventLoopViz } from './EventLoopViz'
import { useAnimationLoop } from '@/hooks/useAnimationLoop'
import { StickyVizLayout } from '@/components/StickyVizLayout'

interface ScrollStageProps {
	children: React.ReactNode
}

export function ScrollStage({ children }: ScrollStageProps) {
	const { contentRef, getStageVisibility } = useScrollStage()
	useAnimationLoop()

	return (
		<StickyVizLayout
			ref={contentRef}
			viz={<EventLoopViz getStageVisibility={getStageVisibility} />}
		>
			{children}
		</StickyVizLayout>
	)
}
