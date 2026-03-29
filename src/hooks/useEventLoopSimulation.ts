'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createInitialState,
  nextState,
  addTask as addTaskPure,
  startStepping,
  stepForward as stepForwardFn,
  stepBack as stepBackFn,
  type SimulationState,
  type TaskType,
} from '@/lib/simulation'
import { SCENARIOS, type Scenario } from '@/lib/scenarios'

export function useEventLoopSimulation() {
  const [state, setState] = useState<SimulationState>(createInitialState)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const cursorHistoryRef = useRef<number[]>([])

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
        if (next.cursorState === 'ORBITING') {
          const history = cursorHistoryRef.current
          const last = history[history.length - 1]
          if (last === undefined || Math.abs(next.cursorPosition - last) > 0.005) {
            history.push(next.cursorPosition)
            if (history.length > 10) history.shift()
          }
        } else {
          cursorHistoryRef.current = []
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
    cursorHistoryRef.current = []
  }, [])

  const runScenario = useCallback((scenarioId: string) => {
    const scenario = SCENARIOS[scenarioId]
    if (!scenario) return

    setState((prev) => {
      let s = prev
      // Unpause if paused
      if (s.isPaused) {
        s = { ...s, isPaused: false }
      }

      // Inject async steps (additive — queue on top)
      if (scenario.asyncSteps) {
        for (const step of scenario.asyncSteps) {
          s = addTaskPure(s, step.type, step.delay)
        }
      }

      // Start sync execution if there are sync ops
      if (scenario.syncOps && scenario.syncOps.length > 0) {
        s = startStepping(s, scenario.syncOps, scenarioId)
      }

      return s
    })
  }, [])

  const stepForward = useCallback(() => {
    setState((prev) => stepForwardFn(prev))
  }, [])

  const stepBack = useCallback(() => {
    setState((prev) => stepBackFn(prev))
  }, [])

  return { state, cursorHistory: cursorHistoryRef, togglePause, addTask, reset, runScenario, stepForward, stepBack }
}
