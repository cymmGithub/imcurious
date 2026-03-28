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
  const positionHistoryRef = useRef<number[]>([])

  useEffect(() => {
    function tick(timestamp: number) {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp
      }

      const dt = Math.min(timestamp - lastTimeRef.current, 50)
      lastTimeRef.current = timestamp

      setState((prev) => {
        const next = nextState(prev, dt)
        // Sample position history for exhaust trail (every other frame to keep it sparse)
        if (next.carState === 'DRIVING') {
          const history = positionHistoryRef.current
          const last = history[history.length - 1]
          if (last === undefined || Math.abs(next.carPosition - last) > 0.005) {
            history.push(next.carPosition)
            if (history.length > 10) history.shift()
          }
        } else {
          positionHistoryRef.current = []
        }
        return next
      })
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
    positionHistoryRef.current = []
  }, [])

  return { state, positionHistory: positionHistoryRef, togglePause, addTask, reset }
}
