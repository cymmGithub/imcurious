'use client'

import { CircleTrack } from './CircleTrack'
import { Station } from './Station'
import { WebApiBox } from './WebApiBox'
import { CallStack } from './CallStack'
import { useEventLoopStore } from '@/stores/eventLoopStore'
import { VIEWBOX, STATION_POSITIONS } from '@/lib/circlePath'
import { EXECUTION_DURATION } from '@/lib/simulation'

interface EventLoopVizProps {
  getStageVisibility: (stage: number) => number
}

const CURSOR_STATE_LABELS: Record<string, string> = {
  ORBITING: 'Cursor orbiting the event loop',
  STOPPED_AT_MICROTASK_QUEUE: 'Stopped at microtask queue',
  EXECUTING_MICROTASK: 'Executing microtask',
  STOPPED_AT_TASK_QUEUE: 'Stopped at callback queue',
  EXECUTING_TASK: 'Executing task',
  STOPPED_AT_RENDER: 'Stopped at render step',
  RENDERING: 'Rendering in progress',
  EXECUTING_SYNC: 'Executing synchronous code',
  STEPPING_SYNC: 'Stepping through synchronous code',
}

export function EventLoopViz({ getStageVisibility }: EventLoopVizProps) {
  const cursorPosition = useEventLoopStore((s) => s.cursorPosition)
  const cursorState = useEventLoopStore((s) => s.cursorState)
  const currentTask = useEventLoopStore((s) => s.currentTask)
  const taskQueue = useEventLoopStore((s) => s.taskQueue)
  const microtaskQueue = useEventLoopStore((s) => s.microtaskQueue)
  const pendingWebAPIs = useEventLoopStore((s) => s.pendingWebAPIs)
  const callStackFrames = useEventLoopStore((s) => s.callStackFrames)
  const executionTimer = useEventLoopStore((s) => s.executionTimer)

  const isAtMicrotask =
    cursorState === 'STOPPED_AT_MICROTASK_QUEUE' ||
    cursorState === 'EXECUTING_MICROTASK'
  const isAtTask =
    cursorState === 'STOPPED_AT_TASK_QUEUE' ||
    cursorState === 'EXECUTING_TASK'
  const isAtRender =
    cursorState === 'STOPPED_AT_RENDER' ||
    cursorState === 'RENDERING'
  const isExecuting =
    cursorState === 'EXECUTING_TASK' ||
    cursorState === 'EXECUTING_MICROTASK' ||
    cursorState === 'RENDERING' ||
    cursorState === 'EXECUTING_SYNC' ||
    cursorState === 'STEPPING_SYNC'

  const renderProgress =
    cursorState === 'RENDERING'
      ? 1 - executionTimer / EXECUTION_DURATION
      : 0

  // Detect hidden work: cursor stopped/executing at a station that's scrolled out of view
  const microtaskVis = getStageVisibility(5)
  const taskVis = getStageVisibility(4)
  const renderVis = getStageVisibility(6)
  const isStoppedAtHiddenStation =
    (isAtMicrotask && microtaskVis < 0.1) ||
    (isAtTask && taskVis < 0.1) ||
    (isAtRender && renderVis < 0.1)
  const hasHiddenWork = isStoppedAtHiddenStation

  const statusLabel = CURSOR_STATE_LABELS[cursorState] ?? 'Simulation running'
  const taskDetail = currentTask ? `: ${currentTask.label}` : ''

  return (
    <div className="relative w-full h-full flex flex-col" role="application" aria-label="Event loop visualization">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {statusLabel}{taskDetail}
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center">
        <svg viewBox={VIEWBOX} className="w-full h-full max-h-full">
          <CircleTrack
            cursorPosition={cursorPosition}
            isExecuting={isExecuting}
            hasHiddenWork={hasHiddenWork}
            dotVisibilities={{
              microtask: microtaskVis,
              task: taskVis,
              render: renderVis,
            }}
          />

          {/* Call Stack — center of circle */}
          <CallStack
            cursorState={cursorState}
            currentTask={currentTask}
            callStackFrames={callStackFrames}
            visibility={getStageVisibility(2)}
          />

          {/* Microtask Queue — 12 o'clock */}
          <Station
            label={STATION_POSITIONS.microtask.label}
            color={STATION_POSITIONS.microtask.color}
            tasks={microtaskQueue}
            currentTask={isAtMicrotask ? currentTask : null}
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
            tasks={taskQueue}
            currentTask={isAtTask ? currentTask : null}
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
            pendingAPIs={pendingWebAPIs}
            visibility={getStageVisibility(3)}
          />
        </svg>
      </div>
    </div>
  )
}
