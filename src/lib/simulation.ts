export type CursorState =
  | 'ORBITING'
  | 'STOPPED_AT_TASK_QUEUE'
  | 'EXECUTING_TASK'
  | 'STOPPED_AT_MICROTASK_QUEUE'
  | 'EXECUTING_MICROTASK'
  | 'STOPPED_AT_RENDER'
  | 'RENDERING'
  | 'EXECUTING_SYNC'

export type TaskType = 'setTimeout' | 'fetch'

export type SyncFrameOp = { action: 'push'; name: string; line?: number } | { action: 'pop'; line?: number }

export type Task = {
  id: string
  type: TaskType
  label: string
  delay?: number
  color: string
}

export type PendingWebAPI = Task & { remainingDelay: number }

export type SimulationState = {
  cursorPosition: number
  cursorState: CursorState
  taskQueue: Task[]
  microtaskQueue: Task[]
  pendingWebAPIs: PendingWebAPI[]
  renderNeeded: boolean
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
}

export const PIT_STOPS = { microtask: 0, task: 1/3, render: 2/3 } as const

const CURSOR_SPEED = 0.0001
export const EXECUTION_DURATION = 600
const STOP_PAUSE = 200
const PIT_STOP_THRESHOLD = 0.02
const SYNC_FRAME_DURATION = 800

const COLOR_MAP: Record<TaskType, string> = {
  setTimeout: '#888888',
  fetch: '#ffffff',
}

export function createInitialState(): SimulationState {
  return {
    cursorPosition: 0,
    cursorState: 'ORBITING',
    taskQueue: [],
    microtaskQueue: [],
    pendingWebAPIs: [],
    renderNeeded: false,
    isPaused: false,
    currentTask: null,
    executionTimer: 0,
    nextId: 0,
    syncFrameOps: [],
    syncFrameIndex: 0,
    callStackFrames: [],
    activeLine: null,
    activeScenarioId: null,
  }
}

export function startSyncExecution(
  state: SimulationState,
  ops: SyncFrameOp[],
  scenarioId: string
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

export function shouldStopAtPitStop(
  prevPos: number,
  pitStopPos: number,
  newPos: number,
  queue: Task[]
): boolean {
  if (queue.length === 0) return false
  // Cursor must cross from before the pit stop to at/after it
  const threshold = pitStopPos - PIT_STOP_THRESHOLD
  return prevPos < pitStopPos && newPos >= threshold
}

export function addTask(
  state: SimulationState,
  type: TaskType,
  delay?: number
): SimulationState {
  const resolvedDelay =
    type === 'setTimeout'
      ? (delay ?? 0)
      : (delay ?? Math.floor(Math.random() * 1000) + 500)

  const label = type === 'setTimeout' ? `setTimeout(${resolvedDelay}ms)` : 'fetch()'
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
    renderNeeded: true,
    nextId: state.nextId + 1,
  }
}

function tickWebAPIs(state: SimulationState, dt: number): SimulationState {
  const stillPending: PendingWebAPI[] = []
  const newTasks: Task[] = []
  const newMicrotasks: Task[] = []

  for (const api of state.pendingWebAPIs) {
    const remaining = api.remainingDelay - dt
    if (remaining <= 0) {
      const task: Task = {
        id: api.id,
        type: api.type,
        label: api.label,
        delay: api.delay,
        color: api.color,
      }
      if (api.type === 'setTimeout') {
        newTasks.push(task)
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
  }
}

export function nextState(state: SimulationState, dt: number): SimulationState {
  if (state.isPaused) return state

  // Always tick web APIs
  let s = tickWebAPIs(state, dt)

  switch (s.cursorState) {
    case 'ORBITING': {
      const prevPos = s.cursorPosition
      let newPos = prevPos + CURSOR_SPEED * dt

      // Check task and render pit stops (at 0.333 and 0.667 — no wrap issues)
      if (prevPos < PIT_STOPS.task && newPos >= PIT_STOPS.task - PIT_STOP_THRESHOLD) {
        if (s.taskQueue.length > 0) {
          return { ...s, cursorPosition: PIT_STOPS.task, cursorState: 'STOPPED_AT_TASK_QUEUE', executionTimer: STOP_PAUSE }
        }
      }

      if (prevPos < PIT_STOPS.render && newPos >= PIT_STOPS.render - PIT_STOP_THRESHOLD) {
        if (s.renderNeeded) {
          return { ...s, cursorPosition: PIT_STOPS.render, cursorState: 'STOPPED_AT_RENDER', executionTimer: STOP_PAUSE }
        }
      }

      // Wrap position
      if (newPos >= 1.0) {
        newPos = newPos - 1.0
        // Check microtask stop after wrap (position 0)
        if (s.microtaskQueue.length > 0) {
          return { ...s, cursorPosition: 0, cursorState: 'STOPPED_AT_MICROTASK_QUEUE', executionTimer: STOP_PAUSE }
        }
      }

      return { ...s, cursorPosition: newPos }
    }

    case 'STOPPED_AT_MICROTASK_QUEUE': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        const [first, ...rest] = s.microtaskQueue
        return {
          ...s,
          cursorState: 'EXECUTING_MICROTASK',
          currentTask: first,
          microtaskQueue: rest,
          executionTimer: EXECUTION_DURATION,
        }
      }
      return { ...s, executionTimer: timer }
    }

    case 'EXECUTING_MICROTASK': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        if (s.microtaskQueue.length > 0) {
          const [next, ...rest] = s.microtaskQueue
          return {
            ...s,
            currentTask: next,
            microtaskQueue: rest,
            executionTimer: EXECUTION_DURATION,
          }
        }
        return { ...s, cursorState: 'ORBITING', currentTask: null, executionTimer: 0 }
      }
      return { ...s, executionTimer: timer }
    }

    case 'STOPPED_AT_TASK_QUEUE': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        const [first, ...rest] = s.taskQueue
        return {
          ...s,
          cursorState: 'EXECUTING_TASK',
          currentTask: first,
          taskQueue: rest,
          executionTimer: EXECUTION_DURATION,
        }
      }
      return { ...s, executionTimer: timer }
    }

    case 'EXECUTING_TASK': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        // Only ONE task per lap
        return { ...s, cursorState: 'ORBITING', currentTask: null, executionTimer: 0 }
      }
      return { ...s, executionTimer: timer }
    }

    case 'STOPPED_AT_RENDER': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        return { ...s, cursorState: 'RENDERING', executionTimer: EXECUTION_DURATION }
      }
      return { ...s, executionTimer: timer }
    }

    case 'RENDERING': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        return { ...s, cursorState: 'ORBITING', renderNeeded: false, currentTask: null, executionTimer: 0 }
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

    default:
      return s
  }
}
