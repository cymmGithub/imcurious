'use client'

import { useRef } from 'react'
import { Track } from './Track'
import { Car } from './Car'
import { PitStop } from './PitStop'
import { Garage } from './Garage'
import { Controls } from './Controls'
import { useEventLoopSimulation } from '@/hooks/useEventLoopSimulation'
import { PIT_STOP_POSITIONS, GARAGE_POSITION } from '@/lib/trackPath'
import { EXECUTION_DURATION } from '@/lib/simulation'

interface EventLoopVizProps {
  getStageVisibility: (stage: number) => number
}

export function EventLoopViz({ getStageVisibility }: EventLoopVizProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const { state, togglePause, addTask, reset } = useEventLoopSimulation()

  const isAtMicrotask =
    state.carState === 'STOPPED_AT_MICROTASK_QUEUE' ||
    state.carState === 'EXECUTING_MICROTASK'
  const isAtTask =
    state.carState === 'STOPPED_AT_TASK_QUEUE' ||
    state.carState === 'EXECUTING_TASK'
  const isAtRender =
    state.carState === 'STOPPED_AT_RENDER' ||
    state.carState === 'RENDERING'
  const isExecuting =
    state.carState === 'EXECUTING_TASK' ||
    state.carState === 'EXECUTING_MICROTASK' ||
    state.carState === 'RENDERING'

  // Render sub-step progress (0–1)
  const renderProgress =
    state.carState === 'RENDERING'
      ? 1 - state.executionTimer / EXECUTION_DURATION
      : 0

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Track area */}
      <div className="relative flex-1 min-h-0">
        <Track ref={pathRef} className="w-full h-full" />

        <Car
          pathRef={pathRef}
          position={state.carPosition}
          isExecuting={isExecuting}
        />

        <Garage
          pendingAPIs={state.pendingWebAPIs}
          position={{ x: GARAGE_POSITION.x, y: GARAGE_POSITION.y }}
          visibility={getStageVisibility(3)}
        />

        {/* Microtask Queue Pit Stop */}
        <PitStop
          label={PIT_STOP_POSITIONS.microtask.label}
          color={PIT_STOP_POSITIONS.microtask.color}
          tasks={state.microtaskQueue}
          currentTask={isAtMicrotask ? state.currentTask : null}
          isActive={isAtMicrotask}
          position={PIT_STOP_POSITIONS.microtask.anchor}
          labelOffset={PIT_STOP_POSITIONS.microtask.labelOffset}
          visibility={getStageVisibility(5)}
        />

        {/* Task Queue Pit Stop */}
        <PitStop
          label={PIT_STOP_POSITIONS.task.label}
          color={PIT_STOP_POSITIONS.task.color}
          tasks={state.taskQueue}
          currentTask={isAtTask ? state.currentTask : null}
          isActive={isAtTask}
          position={PIT_STOP_POSITIONS.task.anchor}
          labelOffset={PIT_STOP_POSITIONS.task.labelOffset}
          visibility={getStageVisibility(4)}
        />

        {/* Render Pit Stop */}
        <PitStop
          label={PIT_STOP_POSITIONS.render.label}
          color={PIT_STOP_POSITIONS.render.color}
          tasks={[]}
          currentTask={null}
          isActive={isAtRender}
          position={PIT_STOP_POSITIONS.render.anchor}
          labelOffset={PIT_STOP_POSITIONS.render.labelOffset}
          visibility={getStageVisibility(6)}
          renderSubSteps
          renderProgress={renderProgress}
        />
      </div>

      {/* Controls — pinned to bottom */}
      <div className="flex-shrink-0 p-3">
        <Controls
          isPaused={state.isPaused}
          onTogglePause={togglePause}
          onAddTask={addTask}
          onReset={reset}
          visibility={getStageVisibility(4)}
        />
      </div>
    </div>
  )
}
