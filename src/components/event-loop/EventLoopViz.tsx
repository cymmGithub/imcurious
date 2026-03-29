'use client'

import { CircleTrack } from './CircleTrack'
import { Station } from './Station'
import { WebApiBox } from './WebApiBox'
import { CallStack } from './CallStack'
import { useEventLoop } from '@/contexts/EventLoopContext'
import { VIEWBOX, STATION_POSITIONS } from '@/lib/circlePath'
import { EXECUTION_DURATION } from '@/lib/simulation'

interface EventLoopVizProps {
  getStageVisibility: (stage: number) => number
}

const CURSOR_STATE_LABELS: Record<string, string> = {
  ORBITING: 'Cursor orbiting the event loop',
  STOPPED_AT_MICROTASK_QUEUE: 'Stopped at microtask queue',
  EXECUTING_MICROTASK: 'Executing microtask',
  STOPPED_AT_TASK_QUEUE: 'Stopped at task queue',
  EXECUTING_TASK: 'Executing task',
  STOPPED_AT_RENDER: 'Stopped at render step',
  RENDERING: 'Rendering in progress',
  EXECUTING_SYNC: 'Executing synchronous code',
}

export function EventLoopViz({ getStageVisibility }: EventLoopVizProps) {
  const { state } = useEventLoop()

  const isAtMicrotask =
    state.cursorState === 'STOPPED_AT_MICROTASK_QUEUE' ||
    state.cursorState === 'EXECUTING_MICROTASK'
  const isAtTask =
    state.cursorState === 'STOPPED_AT_TASK_QUEUE' ||
    state.cursorState === 'EXECUTING_TASK'
  const isAtRender =
    state.cursorState === 'STOPPED_AT_RENDER' ||
    state.cursorState === 'RENDERING'
  const isExecuting =
    state.cursorState === 'EXECUTING_TASK' ||
    state.cursorState === 'EXECUTING_MICROTASK' ||
    state.cursorState === 'RENDERING' ||
    state.cursorState === 'EXECUTING_SYNC'

  const renderProgress =
    state.cursorState === 'RENDERING'
      ? 1 - state.executionTimer / EXECUTION_DURATION
      : 0

  const statusLabel = CURSOR_STATE_LABELS[state.cursorState] ?? 'Simulation running'
  const taskDetail = state.currentTask ? `: ${state.currentTask.label}` : ''

  return (
    <div className="relative w-full h-full flex flex-col" role="application" aria-label="Event loop visualization">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {statusLabel}{taskDetail}
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center">
        <svg viewBox={VIEWBOX} className="w-full h-full max-h-full">
          <CircleTrack
            cursorPosition={state.cursorPosition}
            isExecuting={isExecuting}
            dotVisibilities={{
              microtask: getStageVisibility(5),
              task: getStageVisibility(4),
              render: getStageVisibility(6),
            }}
          />

          {/* Call Stack — center of circle */}
          <CallStack
            cursorState={state.cursorState}
            currentTask={state.currentTask}
            callStackFrames={state.callStackFrames}
            visibility={getStageVisibility(2)}
          />

          {/* Microtask Queue — 12 o'clock */}
          <Station
            label={STATION_POSITIONS.microtask.label}
            color={STATION_POSITIONS.microtask.color}
            tasks={state.microtaskQueue}
            currentTask={isAtMicrotask ? state.currentTask : null}
            isActive={isAtMicrotask}
            visibility={getStageVisibility(5)}
            foreignObjectX={190}
            foreignObjectY={35}
            foreignObjectWidth={220}
            foreignObjectHeight={90}
            align="center"
          />

          {/* Task Queue — ~5 o'clock */}
          <Station
            label={STATION_POSITIONS.task.label}
            color={STATION_POSITIONS.task.color}
            tasks={state.taskQueue}
            currentTask={isAtTask ? state.currentTask : null}
            isActive={isAtTask}
            visibility={getStageVisibility(4)}
            foreignObjectX={460}
            foreignObjectY={370}
            foreignObjectWidth={180}
            foreignObjectHeight={100}
          />

          {/* Render — ~7 o'clock */}
          <Station
            label={STATION_POSITIONS.render.label}
            color={STATION_POSITIONS.render.color}
            tasks={[]}
            currentTask={null}
            isActive={isAtRender}
            visibility={getStageVisibility(6)}
            foreignObjectX={-40}
            foreignObjectY={370}
            foreignObjectWidth={180}
            foreignObjectHeight={130}
            align="right"
            renderSubSteps
            renderProgress={renderProgress}
          />

          {/* Web APIs — external box, right side */}
          <WebApiBox
            pendingAPIs={state.pendingWebAPIs}
            visibility={getStageVisibility(3)}
          />

          {/* Annotation */}
          <text
            x={300}
            y={525}
            textAnchor="middle"
            fontFamily="'Playfair Display', serif"
            fontStyle="italic"
            fontSize={10}
            fill="var(--color-chalk-faint)"
            opacity={getStageVisibility(6)}
          >
            one task per lap — all microtasks drain first
          </text>
        </svg>
      </div>
    </div>
  )
}
