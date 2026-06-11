'use client'

import { useEffect, useRef } from 'react'
import { useSectionStage } from '@/hooks/useSectionStage'
import { useRenderingStore } from '@/stores/renderingStore'
import { StickyVizLayout } from '@/components/StickyVizLayout'
import { RenderingStageViz, STAGE_SCENARIO } from './RenderingStageViz'

const TOTAL_STAGES = 11

interface RenderingScrollStageProps {
	children: React.ReactNode
}

export function RenderingScrollStage({ children }: RenderingScrollStageProps) {
	const { contentRef, activeStage } = useSectionStage(TOTAL_STAGES)
	const activeScenarioId = useRenderingStore((s) => s.activeScenarioId)
	const reset = useRenderingStore((s) => s.reset)

	// A running scenario keeps driving the viz until the reader scrolls to a
	// section it doesn't own. Read the scenario through a ref so this fires
	// only on stage transitions — never on the click that starts a scenario.
	const scenarioRef = useRef(activeScenarioId)
	scenarioRef.current = activeScenarioId
	useEffect(() => {
		const current = scenarioRef.current
		if (current && STAGE_SCENARIO[activeStage] !== current) reset()
	}, [activeStage, reset])

	return (
		<StickyVizLayout
			ref={contentRef}
			vizMinHeight="320px"
			vizOverflow="hidden"
			viz={<RenderingStageViz activeStage={activeStage} />}
		>
			{children}
		</StickyVizLayout>
	)
}
