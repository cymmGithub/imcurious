export type CarState =
  | 'DRIVING'
  | 'STOPPED_AT_TASK_QUEUE'
  | 'EXECUTING_TASK'
  | 'STOPPED_AT_MICROTASK_QUEUE'
  | 'EXECUTING_MICROTASK'
  | 'STOPPED_AT_RENDER'
  | 'RENDERING'

export type TaskType = 'setTimeout' | 'fetch'

export type Task = {
  id: string
  type: TaskType
  label: string
  delay?: number
  color: string
}

export type PendingWebAPI = Task & { remainingDelay: number }

export type SimulationState = {
  carPosition: number
  carState: CarState
  taskQueue: Task[]
  microtaskQueue: Task[]
  pendingWebAPIs: PendingWebAPI[]
  renderNeeded: boolean
  isPaused: boolean
  currentTask: Task | null
  executionTimer: number
  nextId: number
}

export const PIT_STOPS = { microtask: 0.25, task: 0.50, render: 0.75 } as const

const CAR_SPEED = 0.0001
export const EXECUTION_DURATION = 600
const STOP_PAUSE = 200
const PIT_STOP_THRESHOLD = 0.02

const COLOR_MAP: Record<TaskType, string> = {
  setTimeout: '#888888',
  fetch: '#ffffff',
}

export function createInitialState(): SimulationState {
  return {
    carPosition: 0,
    carState: 'DRIVING',
    taskQueue: [],
    microtaskQueue: [],
    pendingWebAPIs: [],
    renderNeeded: false,
    isPaused: false,
    currentTask: null,
    executionTimer: 0,
    nextId: 0,
  }
}

export function shouldStopAtPitStop(
  prevPos: number,
  pitStopPos: number,
  newPos: number,
  queue: Task[]
): boolean {
  if (queue.length === 0) return false
  // Car must cross from before the pit stop to at/after it
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

  switch (s.carState) {
    case 'DRIVING': {
      const prevPos = s.carPosition
      let newPos = prevPos + CAR_SPEED * dt

      // Check pit stops in order
      if (prevPos < PIT_STOPS.microtask && newPos >= PIT_STOPS.microtask - PIT_STOP_THRESHOLD) {
        if (s.microtaskQueue.length > 0) {
          return { ...s, carPosition: PIT_STOPS.microtask, carState: 'STOPPED_AT_MICROTASK_QUEUE', executionTimer: STOP_PAUSE }
        }
      }

      if (prevPos < PIT_STOPS.task && newPos >= PIT_STOPS.task - PIT_STOP_THRESHOLD) {
        if (s.taskQueue.length > 0) {
          return { ...s, carPosition: PIT_STOPS.task, carState: 'STOPPED_AT_TASK_QUEUE', executionTimer: STOP_PAUSE }
        }
      }

      if (prevPos < PIT_STOPS.render && newPos >= PIT_STOPS.render - PIT_STOP_THRESHOLD) {
        if (s.renderNeeded) {
          return { ...s, carPosition: PIT_STOPS.render, carState: 'STOPPED_AT_RENDER', executionTimer: STOP_PAUSE }
        }
      }

      // Wrap position
      if (newPos >= 1.0) {
        newPos = newPos - 1.0
      }

      return { ...s, carPosition: newPos }
    }

    case 'STOPPED_AT_MICROTASK_QUEUE': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        const [first, ...rest] = s.microtaskQueue
        return {
          ...s,
          carState: 'EXECUTING_MICROTASK',
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
        return { ...s, carState: 'DRIVING', currentTask: null, executionTimer: 0 }
      }
      return { ...s, executionTimer: timer }
    }

    case 'STOPPED_AT_TASK_QUEUE': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        const [first, ...rest] = s.taskQueue
        return {
          ...s,
          carState: 'EXECUTING_TASK',
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
        return { ...s, carState: 'DRIVING', currentTask: null, executionTimer: 0 }
      }
      return { ...s, executionTimer: timer }
    }

    case 'STOPPED_AT_RENDER': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        return { ...s, carState: 'RENDERING', executionTimer: EXECUTION_DURATION }
      }
      return { ...s, executionTimer: timer }
    }

    case 'RENDERING': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        return { ...s, carState: 'DRIVING', renderNeeded: false, currentTask: null, executionTimer: 0 }
      }
      return { ...s, executionTimer: timer }
    }

    default:
      return s
  }
}
