'use client'

import { createContext, useContext } from 'react'
import { useEventLoopSimulation } from '@/hooks/useEventLoopSimulation'
import type { SimulationState } from '@/lib/simulation'

type EventLoopContextValue = {
  state: SimulationState
  cursorHistory: React.RefObject<number[]>
  runScenario: (scenarioId: string) => void
}

const EventLoopContext = createContext<EventLoopContextValue | null>(null)

export function EventLoopProvider({ children }: { children: React.ReactNode }) {
  const { state, cursorHistory, runScenario } = useEventLoopSimulation()

  return (
    <EventLoopContext.Provider value={{ state, cursorHistory, runScenario }}>
      {children}
    </EventLoopContext.Provider>
  )
}

export function useEventLoop() {
  const ctx = useContext(EventLoopContext)
  if (!ctx) throw new Error('useEventLoop must be used within EventLoopProvider')
  return ctx
}
