'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { Task } from '@/lib/simulation'

interface QueuesStationProps {
	taskQueue: Task[]
	microtaskQueue: Task[]
	currentTask: Task | null
	isExecutingTask: boolean
	isExecutingMicrotask: boolean
	isActive: boolean
	taskVisibility: number
	microtaskVisibility: number
	foreignObjectX: number
	foreignObjectY: number
	foreignObjectWidth: number
	foreignObjectHeight: number
}

function TaskList({ tasks, color }: { tasks: Task[]; color: string }) {
	if (tasks.length === 0) return null
	return (
		<div
			className="font-mono text-[9px] rounded-md"
			style={{
				padding: '4px 6px',
				marginTop: '4px',
				background: 'var(--color-surface-card)',
				border: `1px solid ${color}33`,
			}}
		>
			<AnimatePresence mode="popLayout">
				{tasks.map((task) => (
					<motion.div
						key={task.id}
						layout
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						className="font-mono text-[9px] rounded-sm"
						style={{
							padding: '2px 6px',
							marginTop: '3px',
							background: `${color}12`,
							color,
							border: `1px solid ${color}1f`,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						}}
					>
						{task.callbackLabel ?? task.label}
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	)
}

export function QueuesStation({
	taskQueue,
	microtaskQueue,
	currentTask,
	isExecutingTask,
	isExecutingMicrotask,
	isActive,
	taskVisibility,
	microtaskVisibility,
	foreignObjectX,
	foreignObjectY,
	foreignObjectWidth,
	foreignObjectHeight,
}: QueuesStationProps) {
	const color = 'var(--color-chalk)'
	const maxVis = Math.max(taskVisibility, microtaskVisibility)

	const displayTaskQueue =
		isExecutingTask && currentTask ? [currentTask, ...taskQueue] : taskQueue
	const displayMicrotaskQueue =
		isExecutingMicrotask && currentTask
			? [currentTask, ...microtaskQueue]
			: microtaskQueue

	return (
		<foreignObject
			x={foreignObjectX}
			y={foreignObjectY}
			width={foreignObjectWidth}
			height={foreignObjectHeight}
			overflow="visible"
			style={{
				opacity: maxVis,
				transition: 'opacity 0.3s ease',
			}}
		>
			<div style={{ textAlign: 'center' }}>
				{/* Main label */}
				<div
					className="font-sketch text-[12px] font-bold tracking-wider uppercase"
					style={{
						color,
						marginBottom: '4px',
						...(isActive
							? {
									textShadow: `0 0 8px color-mix(in srgb, ${color} 30%, transparent)`,
								}
							: {}),
					}}
				>
					Queues
				</div>

				{/* Two fixed-width columns */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						gap: '24px',
					}}
				>
					{/* Task — left of center line */}
					<div
						style={{
							width: '150px',
							opacity: taskVisibility > 0 ? 1 : 0,
							transition: 'opacity 0.3s ease',
							textAlign: 'center',
						}}
					>
						<div
							className="font-sketch text-[10px] tracking-wider uppercase"
							style={{ color: `${color}77`, marginBottom: '2px' }}
						>
							Task
						</div>
						<TaskList tasks={displayTaskQueue} color={color} />
					</div>

					{/* Microtask — right of center line */}
					<div
						style={{
							width: '150px',
							opacity: microtaskVisibility > 0 ? 1 : 0,
							transition: 'opacity 0.3s ease',
							textAlign: 'center',
						}}
					>
						<div
							className="font-sketch text-[10px] tracking-wider uppercase"
							style={{ color: `${color}77`, marginBottom: '2px' }}
						>
							Microtask
						</div>
						<TaskList tasks={displayMicrotaskQueue} color={color} />
					</div>
				</div>
			</div>
		</foreignObject>
	)
}
