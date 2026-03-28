'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createInitialState,
  nextState,
  addTask as addTaskPure,
  type SimulationState,
  type TaskType,
} from '@/lib/simulation'

export function useEventLoopSimulation() {
  const [state, setState] = useState<SimulationState>(createInitialState)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  useEffect(() => {
    function tick(timestamp: number) {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp
      }

      const dt = Math.min(timestamp - lastTimeRef.current, 50) // cap to avoid huge jumps
      lastTimeRef.current = timestamp

      setState((prev) => nextState(prev, dt))
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const togglePause = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: !prev.isPaused }))
  }, [])

  const addTask = useCallback((type: TaskType, delay?: number) => {
    setState((prev) => addTaskPure(prev, type, delay))
  }, [])

  const reset = useCallback(() => {
    setState(createInitialState)
    lastTimeRef.current = 0
  }, [])

  return { state, togglePause, addTask, reset }
}
