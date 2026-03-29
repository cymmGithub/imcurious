'use client'

import { useRef, useEffect } from 'react'
import { useEventLoopStore } from '@/stores/eventLoopStore'

interface StepListProps {
  scenarioId: string
  children: React.ReactNode
}

export function StepList({ scenarioId, children }: StepListProps) {
  const activeScenarioId = useEventLoopStore((s) => s.activeScenarioId)
  const cursorState = useEventLoopStore((s) => s.cursorState)
  const syncFrameIndex = useEventLoopStore((s) => s.syncFrameIndex)
  const ref = useRef<HTMLDivElement>(null)

  const isActive =
    activeScenarioId === scenarioId && cursorState === 'STEPPING_SYNC'

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const items = container.querySelectorAll('li')

    items.forEach((li, i) => {
      if (!isActive) {
        li.style.opacity = '1'
        li.style.borderLeft = '2px solid transparent'
        li.style.transition = 'opacity 0.3s, border-left 0.3s'
        return
      }

      li.style.transition = 'opacity 0.3s, border-left 0.3s'
      if (i === syncFrameIndex) {
        li.style.opacity = '1'
        li.style.borderLeft = '2px solid var(--color-chalk-dim)'
        li.style.paddingLeft = '0.75rem'
      } else {
        li.style.opacity = '0.35'
        li.style.borderLeft = '2px solid transparent'
        li.style.paddingLeft = '0.75rem'
      }
    })
  }, [isActive, syncFrameIndex])

  return <div ref={ref}>{children}</div>
}
