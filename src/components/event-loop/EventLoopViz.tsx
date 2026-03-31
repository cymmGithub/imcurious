'use client'

import { CircleTrack } from './CircleTrack'
import { Station } from './Station'
import { WebApiBox } from './WebApiBox'
import { CallStack } from './CallStack'
import { useEventLoopStore } from '@/stores/eventLoopStore'
import { useShallow } from 'zustand/react/shallow'
import { VIEWBOX, STATION_POSITIONS } from '@/lib/circlePath'

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
	STEPPING_SYNC: 'Stepping through synchronous code',
	FROZEN_SYNC: 'Main thread blocked — cursor frozen',
	STARVED_MICROTASK: 'Microtask starvation — cursor trapped',
}

export function EventLoopViz({ getStageVisibility }: EventLoopVizProps) {
	const cursorPosition = useEventLoopStore((s) => s.cursorPosition)
	const cursorState = useEventLoopStore((s) => s.cursorState)
	const {
		currentTask,
		taskQueue,
		microtaskQueue,
		pendingWebAPIs,
		callStackFrames,
		rAfCallbacks,
	} = useEventLoopStore(
		useShallow((s) => ({
			currentTask: s.currentTask,
			taskQueue: s.taskQueue,
			microtaskQueue: s.microtaskQueue,
			pendingWebAPIs: s.pendingWebAPIs,
			callStackFrames: s.callStackFrames,
			rAfCallbacks: s.rAfCallbacks,
		})),
	)

	const isAtMicrotask =
		cursorState === 'STOPPED_AT_MICROTASK_QUEUE' ||
		cursorState === 'EXECUTING_MICROTASK' ||
		cursorState === 'STARVED_MICROTASK'
	const isAtTask =
		cursorState === 'STOPPED_AT_TASK_QUEUE' || cursorState === 'EXECUTING_TASK'
	const isAtRender =
		cursorState === 'STOPPED_AT_RENDER' || cursorState === 'RENDERING'
	const isExecuting =
		cursorState === 'EXECUTING_TASK' ||
		cursorState === 'EXECUTING_MICROTASK' ||
		cursorState === 'RENDERING' ||
		cursorState === 'EXECUTING_SYNC' ||
		cursorState === 'STEPPING_SYNC' ||
		cursorState === 'FROZEN_SYNC' ||
		cursorState === 'STARVED_MICROTASK'

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
		<div
			className="relative w-full h-full flex flex-col"
			role="img"
			aria-label="Event loop visualization — an animated diagram showing a cursor orbiting through the call stack, task queue, microtask queue, and render steps"
		>
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{statusLabel}
				{taskDetail}
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

					{/* Dashed connector lines from anchor dots to stations */}
					<line
						x1={STATION_POSITIONS.task.anchor.x}
						y1={STATION_POSITIONS.task.anchor.y}
						x2={248}
						y2={48}
						stroke="var(--color-chalk)"
						strokeWidth={1}
						strokeDasharray="4 4"
						opacity={0.3 * taskVis}
					/>
					<line
						x1={STATION_POSITIONS.microtask.anchor.x}
						y1={STATION_POSITIONS.microtask.anchor.y}
						x2={510}
						y2={402}
						stroke="var(--color-chalk)"
						strokeWidth={1}
						strokeDasharray="4 4"
						opacity={0.3 * microtaskVis}
					/>
					<line
						x1={STATION_POSITIONS.render.anchor.x}
						y1={STATION_POSITIONS.render.anchor.y}
						x2={90}
						y2={402}
						stroke="var(--color-chalk)"
						strokeWidth={1}
						strokeDasharray="4 4"
						opacity={0.3 * renderVis}
					/>

					{/* Task Queue — 12 o'clock */}
					<Station
						label={STATION_POSITIONS.task.label}
						color={'var(--color-chalk)'}
						tasks={taskQueue}
						currentTask={isAtTask ? currentTask : null}
						isActive={isAtTask}
						visibility={getStageVisibility(4)}
						foreignObjectX={70}
						foreignObjectY={10}
						foreignObjectWidth={200}
						foreignObjectHeight={90}
						align="right"
					/>

					{/* Microtask Queue — ~5 o'clock */}
					<Station
						label={STATION_POSITIONS.microtask.label}
						color={'var(--color-chalk)'}
						tasks={microtaskQueue}
						currentTask={isAtMicrotask ? currentTask : null}
						isActive={isAtMicrotask}
						visibility={getStageVisibility(5)}
						foreignObjectX={510}
						foreignObjectY={380}
						foreignObjectWidth={180}
						foreignObjectHeight={100}
					/>

					{/* Render — ~7 o'clock */}
					<Station
						label={STATION_POSITIONS.render.label}
						color={'var(--color-chalk)'}
						tasks={rAfCallbacks}
						currentTask={isAtRender ? currentTask : null}
						isActive={isAtRender}
						visibility={getStageVisibility(6)}
						foreignObjectX={-95}
						foreignObjectY={380}
						foreignObjectWidth={180}
						foreignObjectHeight={100}
						align="right"
						showQueueOrder={false}
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
