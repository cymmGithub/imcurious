'use client'

import { useScrollStage } from '@/hooks/useScrollStage'
import { RetryLabViz } from './RetryLabViz'

const TOTAL_STAGES = 7

interface RestStageProps {
	children: React.ReactNode
}

export function RestStage({ children }: RestStageProps) {
	const { contentRef } = useScrollStage(TOTAL_STAGES)

	return (
		<div ref={contentRef} className="relative">
			<div className="flex flex-col lg:flex-row">
				{/* Visualization pane — sticky */}
				<div className="lg:w-1/2 lg:h-screen lg:sticky lg:top-0 h-[40vh] min-h-[320px] sticky top-0 z-10 bg-surface">
					<RetryLabViz />
				</div>

				{/* Content pane — scrollable */}
				<div className="lg:w-1/2 px-6 lg:px-12 py-8 lg:py-16 relative z-0">
					{children}
				</div>
			</div>
		</div>
	)
}
