'use client'

import { CircleTrack } from './CircleTrack'
import { QueuesStation } from './QueuesStation'
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
	STOPPED_AT_QUEUES: 'Stopped at queues — checking for work',
	EXECUTING_MICROTASK: 'Executing microtask',
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

	const isAtQueues =
		cursorState === 'STOPPED_AT_QUEUES' ||
		cursorState === 'EXECUTING_TASK' ||
		cursorState === 'EXECUTING_MICROTASK' ||
		cursorState === 'STARVED_MICROTASK'
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
	const taskVis = getStageVisibility(4)
	const microtaskVis = getStageVisibility(5)
	const renderVis = getStageVisibility(6)
	const queuesVis = Math.max(taskVis, microtaskVis)
	const hasHiddenWork =
		(isAtQueues && queuesVis < 0.1) || (isAtRender && renderVis < 0.1)

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
							queues: queuesVis,
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

					{/* Dashed connector line from anchor dot up through queues station */}
					<line
						x1={STATION_POSITIONS.queues.anchor.x}
						y1={STATION_POSITIONS.queues.anchor.y}
						x2={STATION_POSITIONS.queues.anchor.x}
						y2={25}
						stroke="var(--color-chalk)"
						strokeWidth={1}
						strokeDasharray="4 4"
						opacity={0.3 * queuesVis}
					/>
					{/* Dashed connector line from anchor dot to render station */}
					<line
						x1={STATION_POSITIONS.render.anchor.x}
						y1={STATION_POSITIONS.render.anchor.y}
						x2={STATION_POSITIONS.render.anchor.x}
						y2={500}
						stroke="var(--color-chalk)"
						strokeWidth={1}
						strokeDasharray="4 4"
						opacity={0.3 * renderVis}
					/>

					{/* Queues — 12 o'clock (task + microtask side by side) */}
					<QueuesStation
						taskQueue={taskQueue}
						microtaskQueue={microtaskQueue}
						currentTask={currentTask}
						isExecutingTask={cursorState === 'EXECUTING_TASK'}
						isExecutingMicrotask={
							cursorState === 'EXECUTING_MICROTASK' ||
							cursorState === 'STARVED_MICROTASK'
						}
						isActive={isAtQueues}
						taskVisibility={taskVis}
						microtaskVisibility={microtaskVis}
						foreignObjectX={110}
						foreignObjectY={0}
						foreignObjectWidth={380}
						foreignObjectHeight={130}
					/>

					{/* Render — 6 o'clock */}
					<Station
						label={STATION_POSITIONS.render.label}
						color={'var(--color-chalk)'}
						tasks={rAfCallbacks}
						currentTask={isAtRender ? currentTask : null}
						isActive={isAtRender}
						visibility={getStageVisibility(6)}
						foreignObjectX={210}
						foreignObjectY={500}
						foreignObjectWidth={180}
						foreignObjectHeight={100}
						align="center"
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
