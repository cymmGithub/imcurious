export type CursorState =
  | 'ORBITING'
  | 'STOPPED_AT_TASK_QUEUE'
  | 'EXECUTING_TASK'
  | 'STOPPED_AT_MICROTASK_QUEUE'
  | 'EXECUTING_MICROTASK'
  | 'STOPPED_AT_RENDER'
  | 'RENDERING'
  | 'EXECUTING_SYNC'
  | 'STEPPING_SYNC'

export type TaskType = 'setTimeout' | 'fetch' | 'rAF'

export type SyncStepSnapshot = {
  callStackFrames: string[]
  activeLine: number | null
  pendingWebAPIs: PendingWebAPI[]
}

export type SyncFrameOp =
  | { action: 'push'; name: string; line?: number; asyncEffect?: { type: TaskType; delay?: number } }
  | { action: 'pop'; line?: number }

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

export const PIT_STOPS = { microtask: 0, task: 1/3, render: 2/3 } as const

const CURSOR_SPEED = 0.0001
export const EXECUTION_DURATION = 600
const STOP_PAUSE = 200
const SYNC_FRAME_DURATION = 800

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

export function buildSyncSnapshots(
  ops: SyncFrameOp[],
  startId: number
): { snapshots: SyncStepSnapshot[]; finalWebAPIs: PendingWebAPI[]; nextId: number } {
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
        const { type, delay: d } = op.asyncEffect
        const resolvedDelay = type === 'fetch' ? 999999 : (d ?? 0)
        webAPIs = [...webAPIs, {
          id: String(nextId++),
          type,
          label: type === 'rAF' ? 'rAF' : type === 'setTimeout' ? `setTimeout(${resolvedDelay}ms)` : 'fetch()',
          delay: resolvedDelay,
          color: COLOR_MAP[type],
          remainingDelay: resolvedDelay,
        }]
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
  scenarioId: string
): SimulationState {
  const { snapshots, finalWebAPIs, nextId } = buildSyncSnapshots(ops, state.nextId)
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
  if (state.cursorState !== 'STEPPING_SYNC' || state.syncFrameIndex <= 0) return state

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
  queue: Task[]
): boolean {
  if (queue.length === 0) return false
  // Cursor must actually cross the pit stop position (no early snapping)
  return prevPos < pitStopPos && newPos >= pitStopPos
}

export function resolveFetch(
  state: SimulationState,
  resultLabel: string
): SimulationState {
  // Resolve the first pending fetch (remainingDelay > 99000 = real-fetch placeholder)
  let resolved = false
  return {
    ...state,
    pendingWebAPIs: state.pendingWebAPIs.map((api) => {
      if (!resolved && api.type === 'fetch' && api.remainingDelay > 99000) {
        resolved = true
        return { ...api, label: resultLabel, remainingDelay: 0 }
      }
      return api
    }),
  }
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

  // Always tick web APIs
  let s = tickWebAPIs(state, dt)

  switch (s.cursorState) {
    case 'ORBITING': {
      const prevPos = s.cursorPosition
      let newPos = prevPos + CURSOR_SPEED * dt

      // Check task and render pit stops (at 0.333 and 0.667 — no wrap issues)
      // Use exact crossing check (no threshold) to avoid visible cursor snapping
      if (prevPos < PIT_STOPS.task && newPos >= PIT_STOPS.task) {
        if (s.taskQueue.length > 0) {
          return { ...s, cursorPosition: PIT_STOPS.task, cursorState: 'STOPPED_AT_TASK_QUEUE', executionTimer: STOP_PAUSE }
        }
      }

      if (prevPos < PIT_STOPS.render && newPos >= PIT_STOPS.render) {
        if (s.rAfCallbacks.length > 0) {
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
        return { ...s, cursorState: 'ORBITING', currentTask: null, executionTimer: 0 }
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
