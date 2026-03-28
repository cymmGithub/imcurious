'use client'

import { useScrollStage } from '@/hooks/useScrollStage'
import { EventLoopViz } from './EventLoopViz'

interface ScrollStageProps {
  children: React.ReactNode
}

export function ScrollStage({ children }: ScrollStageProps) {
  const { contentRef, getStageVisibility } = useScrollStage()

  return (
    <div ref={contentRef} className="relative">
      <div className="flex flex-col lg:flex-row">
        {/* Visualization pane — sticky */}
        <div className="lg:w-1/2 lg:h-screen lg:sticky lg:top-0 h-[45vh] sticky top-0 z-10 bg-gray-950">
          <EventLoopViz getStageVisibility={getStageVisibility} />
        </div>

        {/* Content pane — scrollable */}
        <div className="lg:w-1/2 px-6 lg:px-12 py-8 lg:py-16 relative z-0">
          {children}
        </div>
      </div>
    </div>
  )
}
