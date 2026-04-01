export type CursorState =
	| 'ORBITING'
	| 'STOPPED_AT_QUEUES'
	| 'EXECUTING_TASK'
	| 'EXECUTING_MICROTASK'
	| 'STOPPED_AT_RENDER'
	| 'RENDERING'
	| 'EXECUTING_SYNC'
	| 'STEPPING_SYNC'
	| 'FROZEN_SYNC'
	| 'STARVED_MICROTASK'

export type TaskType = 'setTimeout' | 'fetch' | 'rAF'

export type SyncStepSnapshot = {
	callStackFrames: string[]
	activeLine: number | null
	pendingWebAPIs: PendingWebAPI[]
}

export type SyncFrameOp =
	| {
			action: 'push'
			name: string
			line?: number
			asyncEffect?: { type: TaskType; delay?: number; callbackLabel?: string }
	  }
	| { action: 'pop'; line?: number }

export type Task = {
	id: string
	type: TaskType
	label: string
	callbackLabel?: string
	delay?: number
	color: string
}

export type PendingWebAPI = Task & { remainingDelay: number }

export type SimulationState = {
	cursorPosition: number
	cursorState: CursorState
	taskQueue: Task[]
	microtaskQueue: Task[]
	rAfCallbacks: Task[]
	pendingWebAPIs: PendingWebAPI[]
	isPaused: boolean
	currentTask: Task | null
	executionTimer: number
	nextId: number
	// Sync execution state
	syncFrameOps: SyncFrameOp[]
	syncFrameIndex: number
	callStackFrames: string[]
	activeLine: number | null
	activeScenarioId: string | null
	syncStepSnapshots: SyncStepSnapshot[]
	steppingFinalWebAPIs: PendingWebAPI[]
}

export const PIT_STOPS = { queues: 0, render: 1 / 2 } as const

const CURSOR_SPEED = 0.0001
export const EXECUTION_DURATION = 900
const STOP_PAUSE = 300
const SYNC_FRAME_DURATION = 1200

const FREEZE_DURATION = 3000
const STARVE_DURATION = 3000
const STARVE_ADD_INTERVAL = 400
const STARVE_MAX_VISIBLE = 8

const COLOR_MAP: Record<TaskType, string> = {
	setTimeout: '#888888',
	fetch: '#ffffff',
	rAF: '#ffffff',
}

export function createInitialState(): SimulationState {
	return {
		cursorPosition: 0,
		cursorState: 'ORBITING',
		taskQueue: [],
		microtaskQueue: [],
		rAfCallbacks: [],
		pendingWebAPIs: [],
		isPaused: false,
		currentTask: null,
		executionTimer: 0,
		nextId: 0,
		syncFrameOps: [],
		syncFrameIndex: 0,
		callStackFrames: [],
		activeLine: null,
		activeScenarioId: null,
		syncStepSnapshots: [],
		steppingFinalWebAPIs: [],
	}
}

export function startSyncExecution(
	state: SimulationState,
	ops: SyncFrameOp[],
	scenarioId: string,
): SimulationState {
	const firstLine = ops[0]?.line ?? null
	return {
		...state,
		cursorState: 'EXECUTING_SYNC',
		syncFrameOps: ops,
		syncFrameIndex: 0,
		callStackFrames: [],
		executionTimer: SYNC_FRAME_DURATION,
		activeLine: firstLine,
		activeScenarioId: scenarioId,
	}
}

export function buildSyncSnapshots(
	ops: SyncFrameOp[],
	startId: number,
): {
	snapshots: SyncStepSnapshot[]
	finalWebAPIs: PendingWebAPI[]
	nextId: number
} {
	const snapshots: SyncStepSnapshot[] = []
	let stack: string[] = []
	let webAPIs: PendingWebAPI[] = []
	let nextId = startId

	for (let i = 0; i < ops.length; i++) {
		// Apply op first so snapshot reflects the result of this step
		const op = ops[i]
		if (op.action === 'push') {
			stack = [...stack, op.name]
			if (op.asyncEffect) {
				const { type, delay: d, callbackLabel } = op.asyncEffect
				const resolvedDelay = type === 'fetch' ? 999999 : (d ?? 0)
				webAPIs = [
					...webAPIs,
					{
						id: String(nextId++),
						type,
						label:
							type === 'rAF'
								? 'rAF'
								: type === 'setTimeout'
									? `setTimeout(${resolvedDelay}ms)`
									: 'fetch()',
						callbackLabel,
						delay: resolvedDelay,
						color: COLOR_MAP[type],
						remainingDelay: resolvedDelay,
					},
				]
			}
		} else {
			stack = stack.slice(0, -1)
		}

		snapshots.push({
			callStackFrames: [...stack],
			activeLine: ops[i].line ?? null,
			pendingWebAPIs: [...webAPIs],
		})
	}
	return { snapshots, finalWebAPIs: [...webAPIs], nextId }
}

export function startStepping(
	state: SimulationState,
	ops: SyncFrameOp[],
	scenarioId: string,
): SimulationState {
	const { snapshots, finalWebAPIs, nextId } = buildSyncSnapshots(
		ops,
		state.nextId,
	)
	return {
		...state,
		cursorState: 'STEPPING_SYNC',
		syncFrameOps: ops,
		syncFrameIndex: 0,
		callStackFrames: snapshots[0].callStackFrames,
		activeLine: snapshots[0].activeLine,
		pendingWebAPIs: snapshots[0].pendingWebAPIs,
		syncStepSnapshots: snapshots,
		steppingFinalWebAPIs: finalWebAPIs,
		activeScenarioId: scenarioId,
		executionTimer: 0,
		nextId,
	}
}

export function startFreeze(state: SimulationState): SimulationState {
	return {
		...state,
		cursorState: 'FROZEN_SYNC',
		executionTimer: FREEZE_DURATION,
		callStackFrames: ['while (Date.now() < …)'],
		activeScenarioId: 'blocking-while-loop',
		activeLine: null,
	}
}

export function startStarve(state: SimulationState): SimulationState {
	return {
		...state,
		cursorState: 'STARVED_MICROTASK',
		cursorPosition: PIT_STOPS.queues,
		executionTimer: STARVE_DURATION,
		syncFrameIndex: 0,
		callStackFrames: ['forever()', 'Promise.then(forever)'],
		activeScenarioId: 'infinite-microtasks',
		activeLine: null,
		microtaskQueue: [
			{
				id: String(state.nextId),
				type: 'fetch',
				label: 'forever()',
				color: COLOR_MAP.fetch,
			},
		],
		nextId: state.nextId + 1,
	}
}

export function stepForward(state: SimulationState): SimulationState {
	if (state.cursorState !== 'STEPPING_SYNC') return state

	const nextIndex = state.syncFrameIndex + 1
	if (nextIndex >= state.syncFrameOps.length) {
		// Done — transition to ORBITING with accumulated Web APIs
		return {
			...state,
			cursorState: 'ORBITING',
			callStackFrames: [],
			syncFrameOps: [],
			syncFrameIndex: 0,
			syncStepSnapshots: [],
			executionTimer: 0,
			activeLine: null,
			activeScenarioId: null,
			pendingWebAPIs: state.steppingFinalWebAPIs,
			steppingFinalWebAPIs: [],
			rAfCallbacks: [],
		}
	}

	const snapshot = state.syncStepSnapshots[nextIndex]
	return {
		...state,
		syncFrameIndex: nextIndex,
		callStackFrames: snapshot.callStackFrames,
		activeLine: snapshot.activeLine,
		pendingWebAPIs: snapshot.pendingWebAPIs,
	}
}

export function stepBack(state: SimulationState): SimulationState {
	if (state.cursorState !== 'STEPPING_SYNC' || state.syncFrameIndex <= 0)
		return state

	const prevIndex = state.syncFrameIndex - 1
	const snapshot = state.syncStepSnapshots[prevIndex]
	return {
		...state,
		syncFrameIndex: prevIndex,
		callStackFrames: snapshot.callStackFrames,
		activeLine: snapshot.activeLine,
		pendingWebAPIs: snapshot.pendingWebAPIs,
	}
}

export function shouldStopAtPitStop(
	prevPos: number,
	pitStopPos: number,
	newPos: number,
	queue: Task[],
): boolean {
	if (queue.length === 0) return false
	// Cursor must actually cross the pit stop position (no early snapping)
	return prevPos < pitStopPos && newPos >= pitStopPos
}

export function resolveFetch(
	state: SimulationState,
	resultLabel: string,
	resolvedCallbackLabel?: string,
): SimulationState {
	// Resolve the first pending fetch (remainingDelay > 99000 = real-fetch placeholder)
	let resolved = false
	return {
		...state,
		pendingWebAPIs: state.pendingWebAPIs.map((api) => {
			if (!resolved && api.type === 'fetch' && api.remainingDelay > 99000) {
				resolved = true
				return {
					...api,
					label: resultLabel,
					callbackLabel: resolvedCallbackLabel ?? api.callbackLabel,
					remainingDelay: 0,
				}
			}
			return api
		}),
	}
}

export function addTask(
	state: SimulationState,
	type: TaskType,
	delay?: number,
): SimulationState {
	const resolvedDelay =
		type === 'setTimeout'
			? (delay ?? 0)
			: (delay ?? Math.floor(Math.random() * 1000) + 500)

	const label =
		type === 'setTimeout' ? `setTimeout(${resolvedDelay}ms)` : 'fetch()'
	const task: PendingWebAPI = {
		id: String(state.nextId),
		type,
		label,
		delay: resolvedDelay,
		color: COLOR_MAP[type],
		remainingDelay: resolvedDelay,
	}

	return {
		...state,
		pendingWebAPIs: [...state.pendingWebAPIs, task],
		nextId: state.nextId + 1,
	}
}

function tickWebAPIs(state: SimulationState, dt: number): SimulationState {
	const stillPending: PendingWebAPI[] = []
	const newTasks: Task[] = []
	const newMicrotasks: Task[] = []
	const newRAfCallbacks: Task[] = []

	for (const api of state.pendingWebAPIs) {
		const remaining = api.remainingDelay - dt
		if (remaining <= 0) {
			const task: Task = {
				id: api.id,
				type: api.type,
				label: api.label,
				callbackLabel: api.callbackLabel,
				delay: api.delay,
				color: api.color,
			}
			if (api.type === 'setTimeout') {
				newTasks.push(task)
			} else if (api.type === 'rAF') {
				newRAfCallbacks.push(task)
			} else {
				newMicrotasks.push(task)
			}
		} else {
			stillPending.push({ ...api, remainingDelay: remaining })
		}
	}

	return {
		...state,
		pendingWebAPIs: stillPending,
		taskQueue: [...state.taskQueue, ...newTasks],
		microtaskQueue: [...state.microtaskQueue, ...newMicrotasks],
		rAfCallbacks: [...state.rAfCallbacks, ...newRAfCallbacks],
	}
}

export function nextState(state: SimulationState, dt: number): SimulationState {
	if (state.isPaused) return state
	if (state.cursorState === 'STEPPING_SYNC') return state

	// Demo states bypass web API ticking — total freeze / starvation
	if (state.cursorState === 'FROZEN_SYNC') {
		const timer = state.executionTimer - dt
		if (timer <= 0) {
			return {
				...state,
				cursorState: 'ORBITING',
				callStackFrames: [],
				activeScenarioId: null,
				executionTimer: 0,
			}
		}
		return { ...state, executionTimer: timer }
	}

	if (state.cursorState === 'STARVED_MICROTASK') {
		const timer = state.executionTimer - dt
		if (timer <= 0) {
			return {
				...state,
				cursorState: 'ORBITING',
				callStackFrames: [],
				activeScenarioId: null,
				executionTimer: 0,
				microtaskQueue: [],
				syncFrameIndex: 0,
			}
		}
		let accumulator = state.syncFrameIndex + dt
		let queue = state.microtaskQueue
		let nextId = state.nextId
		if (accumulator >= STARVE_ADD_INTERVAL) {
			accumulator -= STARVE_ADD_INTERVAL
			if (queue.length < STARVE_MAX_VISIBLE) {
				queue = [
					...queue,
					{
						id: String(nextId++),
						type: 'fetch',
						label: 'forever()',
						color: COLOR_MAP.fetch,
					},
				]
			}
		}
		return {
			...state,
			executionTimer: timer,
			syncFrameIndex: accumulator,
			microtaskQueue: queue,
			nextId,
		}
	}

	// Always tick web APIs
	let s = tickWebAPIs(state, dt)

	switch (s.cursorState) {
		case 'ORBITING': {
			const prevPos = s.cursorPosition
			let newPos = prevPos + CURSOR_SPEED * dt

			// Check render pit stop at 0.5
			if (prevPos < PIT_STOPS.render && newPos >= PIT_STOPS.render) {
				if (s.rAfCallbacks.length > 0) {
					return {
						...s,
						cursorPosition: PIT_STOPS.render,
						cursorState: 'STOPPED_AT_RENDER',
						executionTimer: STOP_PAUSE,
					}
				}
			}

			// Wrap position
			if (newPos >= 1.0) {
				newPos = newPos - 1.0
				// Check queues stop after wrap (position 0)
				// Both queues share one station — microtasks drain first
				if (s.microtaskQueue.length > 0 || s.taskQueue.length > 0) {
					return {
						...s,
						cursorPosition: 0,
						cursorState: 'STOPPED_AT_QUEUES',
						executionTimer: STOP_PAUSE,
					}
				}
			}

			return { ...s, cursorPosition: newPos }
		}

		case 'STOPPED_AT_QUEUES': {
			const timer = s.executionTimer - dt
			if (timer <= 0) {
				// Microtasks always have priority
				if (s.microtaskQueue.length > 0) {
					const [first, ...rest] = s.microtaskQueue
					return {
						...s,
						cursorState: 'EXECUTING_MICROTASK',
						currentTask: first,
						microtaskQueue: rest,
						executionTimer: EXECUTION_DURATION,
					}
				}
				// Then one task
				if (s.taskQueue.length > 0) {
					const [first, ...rest] = s.taskQueue
					return {
						...s,
						cursorState: 'EXECUTING_TASK',
						currentTask: first,
						taskQueue: rest,
						executionTimer: EXECUTION_DURATION,
					}
				}
				// Both empty (race condition) — resume orbiting
				return { ...s, cursorState: 'ORBITING', executionTimer: 0 }
			}
			return { ...s, executionTimer: timer }
		}

		case 'EXECUTING_MICROTASK': {
			const timer = s.executionTimer - dt
			if (timer <= 0) {
				// Continue draining microtasks
				if (s.microtaskQueue.length > 0) {
					const [next, ...rest] = s.microtaskQueue
					return {
						...s,
						currentTask: next,
						microtaskQueue: rest,
						executionTimer: EXECUTION_DURATION,
					}
				}
				// Microtasks drained — check task queue
				if (s.taskQueue.length > 0) {
					const [first, ...rest] = s.taskQueue
					return {
						...s,
						cursorState: 'EXECUTING_TASK',
						currentTask: first,
						taskQueue: rest,
						executionTimer: EXECUTION_DURATION,
					}
				}
				// Both empty — leave station
				return {
					...s,
					cursorState: 'ORBITING',
					currentTask: null,
					executionTimer: 0,
				}
			}
			return { ...s, executionTimer: timer }
		}

		case 'EXECUTING_TASK': {
			const timer = s.executionTimer - dt
			if (timer <= 0) {
				// After one task, check if microtasks appeared (web API timing)
				if (s.microtaskQueue.length > 0) {
					const [first, ...rest] = s.microtaskQueue
					return {
						...s,
						cursorState: 'EXECUTING_MICROTASK',
						currentTask: first,
						microtaskQueue: rest,
						executionTimer: EXECUTION_DURATION,
					}
				}
				// Only ONE task per visit — leave station
				return {
					...s,
					cursorState: 'ORBITING',
					currentTask: null,
					executionTimer: 0,
				}
			}
			return { ...s, executionTimer: timer }
		}

		case 'STOPPED_AT_RENDER': {
			const timer = s.executionTimer - dt
			if (timer <= 0) {
				const [first, ...rest] = s.rAfCallbacks
				return {
					...s,
					cursorState: 'RENDERING',
					executionTimer: EXECUTION_DURATION,
					currentTask: first ?? null,
					rAfCallbacks: rest,
				}
			}
			return { ...s, executionTimer: timer }
		}

		case 'RENDERING': {
			const timer = s.executionTimer - dt
			if (timer <= 0) {
				return {
					...s,
					cursorState: 'ORBITING',
					currentTask: null,
					executionTimer: 0,
				}
			}
			return { ...s, executionTimer: timer }
		}

		case 'EXECUTING_SYNC': {
			const timer = s.executionTimer - dt
			if (timer <= 0) {
				// Apply current frame op
				let frames = [...s.callStackFrames]
				const op = s.syncFrameOps[s.syncFrameIndex]
				if (op) {
					if (op.action === 'push') {
						frames = [...frames, op.name]
					} else {
						frames = frames.slice(0, -1)
					}
				}

				const nextIndex = s.syncFrameIndex + 1
				if (nextIndex >= s.syncFrameOps.length) {
					// Done with all sync ops
					return {
						...s,
						cursorState: 'ORBITING',
						callStackFrames: [],
						syncFrameOps: [],
						syncFrameIndex: 0,
						executionTimer: 0,
						activeLine: null,
						activeScenarioId: null,
					}
				}

				const nextOp = s.syncFrameOps[nextIndex]
				return {
					...s,
					callStackFrames: frames,
					syncFrameIndex: nextIndex,
					executionTimer: SYNC_FRAME_DURATION,
					activeLine: nextOp?.line ?? s.activeLine,
				}
			}
			return { ...s, executionTimer: timer }
		}

		case 'STEPPING_SYNC':
			return s

		default:
			return s
	}
}
